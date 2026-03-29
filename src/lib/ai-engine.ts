/**
 * AI Engine - แกนกลางประมวลผลข้อความ
 * ใช้ร่วมกันทั้ง Web UI และ Telegram Bot
 *
 * Flow: Built-in parser (บัญชี) → OpenClaw/OpenRouter (คุยทั่วไป) → Fallback
 */

import { connectDb } from "./db";
import { Transaction } from "./models/Transaction";
import { ChatMessage } from "./models/ChatMessage";
import { PendingTx } from "./models/PendingTx";
import { DEMO_USERS, toBuddhistYear } from "./demo-users";
import { askAI } from "./openclaw";
import { Budget } from "./models/Budget";
import { SavingsGoal } from "./models/SavingsGoal";
import { Debt } from "./models/Debt";
import { Reminder } from "./models/Reminder";
import { getDialectPrompt } from "./i18n";
import { analyzeImage, buildVisionReply, VisionResult } from "./vision";
import { getCompactHistory } from "./chat-compact";
import { FileDoc } from "./models/FileDoc";
import { uploadToR2 } from "./r2";
import { v4 as uuidv4 } from "uuid";

export interface AiResult {
  reply: string;
  action: string;
  transaction?: any;
}

// --------- Built-in Thai Transaction Parser ---------

function parseTransaction(msg: string) {
  const amountMatch = msg.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:บาท)?/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (amount <= 0 || amount > 10000000) return null; // จำกัด 10 ล้านบาท

  const incomeKw = ["ขาย", "ได้เงิน", "รับเงิน", "เงินเดือน", "ค่าจ้าง", "รับจ้าง", "สวัสดิการ", "เงินช่วย", "รายได้", "ปันผล", "ให้เงิน", "ให้มา", "เงินมา", "โอนมา", "โอนเข้า", "เข้าบัญชี", "คืนเงิน", "ได้มา", "รับมา", "เงินเข้า", "โบนัส", "ทิป", "ของขวัญ"];
  const expenseKw = ["ซื้อ", "จ่าย", "ค่า", "ซ่อม", "ทำบุญ", "บริจาค", "เสีย", "โอนไป", "โอนออก", "จ่ายค่า", "จ่ายเงิน", "เสียเงิน", "หมดไป", "ใช้จ่าย"];

  const isIncome = incomeKw.some((k) => msg.includes(k));
  const isExpense = expenseKw.some((k) => msg.includes(k));

  let type: "income" | "expense";
  if (isIncome && !isExpense) type = "income";
  else if (isExpense) type = "expense";
  else return null;

  let category: string;
  if (type === "income") {
    if (/สวัสดิการ|เงินช่วย|สงเคราะห์/.test(msg)) category = "สวัสดิการ";
    else if (/เช่า|ขายที่|ขายบ้าน/.test(msg)) category = "ขาย/เช่าทรัพย์สิน";
    else if (/กู้|ยืม/.test(msg)) category = "เงินกู้ยืม";
    else category = "รายได้อาชีพหลัก";
  } else {
    if (/ปุ๋ย|เมล็ด|อาหารสัตว์|เครื่องมือ|น้ำมัน|ค่าเช่า|ค่าจ้าง|ยาฆ่า|หัวเชื้อ/.test(msg)) category = "ค่าประกอบอาชีพ";
    else if (/อาหาร|ข้าวสาร|กับข้าว|ของใช้|ไฟฟ้า|น้ำประปา|แก๊ส|สบู่|ยาสีฟัน/.test(msg)) category = "อาหาร/ของใช้";
    else if (/เรียน|โรงเรียน|มหาวิทยาลัย|หนังสือ|ค่าเทอม/.test(msg)) category = "การศึกษา";
    else if (/ทำบุญ|งานแต่ง|งานศพ|วัด|บริจาค|ซองงาน/.test(msg)) category = "งานสังคม";
    else if (/เที่ยว|พักผ่อน|หนัง|เกม/.test(msg)) category = "พักผ่อน";
    else if (/เสื้อ|ผ้า|รองเท้า|กระเป๋า/.test(msg)) category = "เสื้อผ้า";
    else category = "อาหาร/ของใช้";
  }

  const description = msg.replace(/(\d[\d,]*(?:\.\d+)?)\s*(?:บาท)?/g, "").replace(/\s+/g, " ").trim() || msg;

  return { type, amount, description, category };
}

// --------- System Prompt Builder ---------

async function buildSystemPrompt(userId: string) {
  const currentMonth = toBuddhistYear(new Date()).substring(0, 7);
  const monthStart = `${currentMonth}-01`;
  const monthEnd = `${currentMonth}-31`;

  // รวมทุก query เป็น 1 Promise.all — ไม่มี query นอก parallel
  const [totalsResult, recentTxs, budgets, goals, debts, reminders, monthExpenses] = await Promise.all([
    // รวม income+expense เป็น 1 query แทน 2
    Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    Budget.find({ userId, month: currentMonth }).lean(),
    SavingsGoal.find({ userId }).lean(),
    Debt.find({ userId, active: true }).lean(),
    Reminder.find({ userId, active: true }).lean(),
    // ย้าย budget expenses มารวมใน parallel
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = totalsResult.find((t: any) => t._id === "income")?.total || 0;
  const totalExpense = totalsResult.find((t: any) => t._id === "expense")?.total || 0;
  const user = DEMO_USERS.find((u) => u.id === userId);

  const recent = recentTxs.map((t: any) =>
    `${t.type === "income" ? "รายรับ" : "รายจ่าย"}: ${t.description} ${t.amount} บาท (${t.date})`
  ).join("\n");

  // Budget warnings
  let budgetInfo = "";
  if (budgets.length > 0) {
    const spendMap: Record<string, number> = {};
    for (const e of monthExpenses) spendMap[e._id] = e.total;

    const budgetLines = (budgets as any[]).map((b) => {
      const spent = spendMap[b.category] || 0;
      const pct = Math.round((spent / b.monthlyLimit) * 100);
      const warn = pct >= 100 ? "⚠️ เกินงบ!" : pct >= 80 ? "⚠️ ใกล้เต็ม" : "✅";
      return `${b.category}: ใช้ ${spent.toLocaleString()}/${b.monthlyLimit.toLocaleString()} (${pct}%) ${warn}`;
    });
    budgetInfo = `\nงบประมาณเดือนนี้:\n${budgetLines.join("\n")}`;
  }

  // Savings goals
  let goalsInfo = "";
  if (goals.length > 0) {
    goalsInfo = `\nเป้าออมเงิน:\n${(goals as any[]).map((g) =>
      `${g.icon} ${g.name}: ${g.currentAmount.toLocaleString()}/${g.targetAmount.toLocaleString()} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`
    ).join("\n")}`;
  }

  // Debts
  let debtInfo = "";
  if (debts.length > 0) {
    debtInfo = `\nหนี้สินที่ยังผ่อนอยู่:\n${(debts as any[]).map((d) =>
      `${d.creditor}: เหลือ ${(d.totalAmount - d.paidAmount).toLocaleString()} บาท (${d.paidInstallments}/${d.installments} งวด) จ่ายทุกวันที่ ${d.dueDay}`
    ).join("\n")}`;
  }

  // Upcoming reminders
  const today = new Date().getDate();
  const upcoming = (reminders as any[]).filter((r) => Math.abs(r.dueDay - today) <= 5 || (r.dueDay <= 5 && today >= 26));
  let reminderInfo = "";
  if (upcoming.length > 0) {
    reminderInfo = `\nรายการที่ใกล้ถึงกำหนด:\n${upcoming.map((r) =>
      `${r.title} ${r.amount > 0 ? r.amount.toLocaleString() + " บาท" : ""} วันที่ ${r.dueDay}`
    ).join("\n")}`;
  }

  return `คุณคือ "น้องบัญชี" เลขาส่วนตัวประจำครัวเรือนของ${user?.name || "ผู้ใช้"}

กฎสำคัญ:
- ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาจีนหรืออังกฤษ
- จำบทสนทนาที่ผ่านมาได้ ถ้าเขาเคยเล่าอะไรไว้ ให้อ้างอิงถึงได้
- ทำตัวเหมือนเลขาที่ดี: จำได้ว่าเจ้านายชอบอะไร ไม่ชอบอะไร เคยบอกอะไรไว้
- พูดสุภาพ อบอุ่น เหมือนคนใกล้ชิดที่ห่วงใย
- ให้คำแนะนำเรื่องการเงินเชิงรุก เช่น เตือนถ้ารายจ่ายเยอะ แนะนำวิธีออม
- ถ้างบประมาณหมวดไหนใกล้เต็มหรือเกิน ให้เตือนเจ้านายด้วย
- สำคัญมาก: ห้ามคิดเลข/เดาตัวเลข/อ้างตัวเลขเรื่องเงินเด็ดขาด
- ถ้าถามเรื่องยอดเงิน/รายรับ/รายจ่าย/คงเหลือ/ออม/หนี้ ให้ใช้ข้อมูลด้านล่างเท่านั้น
- ถ้าไม่มีข้อมูลหรือไม่แน่ใจ ให้บอกว่า "ลองพิมพ์ สรุปยอด เพื่อดูข้อมูลล่าสุดจากฐานข้อมูลค่ะ"
- ห้ามบอกตัวเลขที่ไม่ได้อยู่ในข้อมูลด้านล่าง ห้ามคำนวณเอง ห้ามประมาณ
- ถ้าหนี้ใกล้ถึงกำหนดจ่าย ให้เตือนด้วย
- ถ้าเป้าออมใกล้ถึงเป้า ให้ให้กำลังใจ

ข้อมูลเจ้านาย:
- ชื่อ: ${user?.name || "ไม่ทราบ"}
- อาชีพ: ${user?.occupation || "ไม่ทราบ"}
- รายรับรวม: ${totalIncome.toLocaleString()} บาท
- รายจ่ายรวม: ${totalExpense.toLocaleString()} บาท
- คงเหลือ: ${(totalIncome - totalExpense).toLocaleString()} บาท
${budgetInfo}${goalsInfo}${debtInfo}${reminderInfo}

รายการล่าสุด:
${recent || "(ยังไม่มี)"}

วันนี้: ${toBuddhistYear(new Date())}

สิ่งที่น้องบัญชีทำได้:
- จดบันทึกรายรับ-รายจ่ายให้ (เขาจะพิมพ์มา ระบบจัดการให้อัตโนมัติ)
- สรุปยอดบัญชี + สรุปงบประมาณ
- อ่านรูป slip/ใบเสร็จ
- ให้คำแนะนำการเงิน การออม เรื่องทั่วไป
- เตือนเรื่องหนี้สิน งบประมาณ เป้าออม
- พยากรณ์รายจ่ายเดือนหน้า
- คุยเป็นเพื่อน ให้กำลังใจ
- จำเรื่องที่คุยกันไว้ และอ้างอิงได้ในบทสนทนาถัดไป`;
}

// --------- Main Process Message ---------

export async function processMessage(
  message: string,
  userId: string,
  dialect?: string
): Promise<AiResult> {
  await connectDb();
  const msg = message.trim();

  // 0. ตรวจว่ามี pending transaction จากรูปภาพ รอยืนยันอยู่ไหม
  const pending = await PendingTx.findOne({ userId }).sort({ createdAt: -1 });
  if (pending) {
    const lower = msg.toLowerCase();
    if (/^(ใช่|ใช้|ตกลง|ok|yes|บันทึก|ได้|เอา)/.test(lower)) {
      // ยืนยันตาม suggestedType
      const type = pending.suggestedType === "unknown" ? "expense" : pending.suggestedType;
      return await confirmPendingTx(pending, type, userId);
    }
    if (/รายรับ|income|เงินเข้า|ได้เงิน/.test(lower)) {
      return await confirmPendingTx(pending, "income", userId);
    }
    if (/รายจ่าย|expense|จ่ายเงิน|เงินออก/.test(lower)) {
      return await confirmPendingTx(pending, "expense", userId);
    }
    if (/ไม่|ยกเลิก|cancel|skip/.test(lower)) {
      await PendingTx.deleteOne({ _id: pending._id });
      return { reply: "ยกเลิกแล้วค่ะ ไม่บันทึกรายการนี้", action: "cancelled" };
    }
    // ถ้าพิมพ์อย่างอื่น ลบ pending แล้วประมวลผลปกติ
    await PendingTx.deleteOne({ _id: pending._id });
  }

  // 1. ส่ง AI วิเคราะห์ว่า user ต้องการทำอะไร (intent classification)
  // AI จะตอบ JSON: {intent, amount, description, type, category}
  let aiIntent: any = null;
  try {
    const classifyResult = await askAI(
      `วิเคราะห์ข้อความนี้แล้วตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown):
{
  "intent": "record" หรือ "summary" หรือ "list" หรือ "delete" หรือ "chat",
  "amount": ตัวเลขจำนวนเงิน (ถ้ามี, ไม่มีใส่ 0),
  "description": "คำอธิบายรายการสั้นๆ",
  "type": "income" หรือ "expense" หรือ "unknown",
  "category": "หมวดหมู่ที่เหมาะสม เช่น รายได้อาชีพหลัก, อาหาร/ของใช้, ค่าประกอบอาชีพ, งานสังคม, การศึกษา, พักผ่อน",
  "confidence": "high" หรือ "low"
}

กฎ:
- intent="record": ต้องการบันทึกรายรับหรือรายจ่าย (มีจำนวนเงิน)
- intent="summary": ต้องการดูสรุปยอด/ยอดคงเหลือ/รายรับรวม/รายจ่ายรวม
- intent="list": ต้องการดูรายการล่าสุด/ประวัติ
- intent="delete": ต้องการลบ/ยกเลิกรายการ
- intent="chat": คุยทั่วไป ไม่เกี่ยวกับบัญชี
- type: ถ้าเป็นเงินเข้า/รับ/ขาย/ให้มา = "income", ถ้าจ่าย/ซื้อ/ค่า = "expense"
- confidence="low": ถ้าไม่แน่ใจว่ารายรับหรือรายจ่าย

ข้อความ: "${msg}"`,
      "ตอบเป็น JSON เท่านั้น",
      []
    );
    if (classifyResult?.reply) {
      const jsonMatch = classifyResult.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiIntent = JSON.parse(jsonMatch[0]);
    }
  } catch {}

  // Fallback: ถ้า AI ไม่ตอบ ใช้ regex พื้นฐาน
  if (!aiIntent) {
    if (/สรุป|ยอด|เหลือเท่าไ|คงเหลือ|เงินเท่าไ/.test(msg)) aiIntent = { intent: "summary" };
    else if (/รายการ|ล่าสุด|ดูบัญชี|ประวัติ/.test(msg)) aiIntent = { intent: "list" };
    else aiIntent = { intent: "chat" };
  }

  // 2. ดำเนินการตาม intent

  // === สรุปยอด → ดึง DB จริงเท่านั้น ===
  if (aiIntent.intent === "summary") {
    const [inc, exp] = await Promise.all([
      Transaction.aggregate([{ $match: { userId, type: "income" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Transaction.aggregate([{ $match: { userId, type: "expense" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    const totalIncome = inc[0]?.total || 0;
    const totalExpense = exp[0]?.total || 0;
    const balance = totalIncome - totalExpense;
    let advice = "";
    if (balance > 0) advice = `\n\nแนะนำ: ลองแบ่งออม ${Math.round(balance * 0.3).toLocaleString()} บาท (30%) นะคะ`;
    else if (balance < 0) advice = `\n\nระวัง: รายจ่ายเกินรายรับ ${Math.abs(balance).toLocaleString()} บาท`;

    return {
      reply: `📊 สรุปบัญชี (จากฐานข้อมูล):\n📥 รายรับรวม: ${totalIncome.toLocaleString()} บาท\n📤 รายจ่ายรวม: ${totalExpense.toLocaleString()} บาท\n💰 คงเหลือ: ${balance.toLocaleString()} บาท${advice}`,
      action: "summary",
    };
  }

  // === ดูรายการ → ดึง DB ===
  if (aiIntent.intent === "list") {
    const recent = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    if (recent.length === 0) return { reply: "ยังไม่มีรายการ ลองพิมพ์ 'ขายข้าว 3000 บาท' เพื่อเริ่มบันทึก!", action: "list" };
    const list = recent.map((t: any) => `${t.type === "income" ? "📥" : "📤"} ${t.description} - ${t.amount.toLocaleString()} บาท (${t.date})`).join("\n");
    return { reply: `📋 รายการล่าสุด:\n${list}`, action: "list" };
  }

  // === ลบรายการ → ดึง DB + แสดงรายการล่าสุด ===
  if (aiIntent.intent === "delete") {
    const recent = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    if (recent.length === 0) return { reply: "ยังไม่มีรายการที่จะลบค่ะ", action: "list" };
    const list = recent.map((t: any, i: number) => `${i + 1}. ${t.type === "income" ? "📥" : "📤"} ${t.description} - ${t.amount.toLocaleString()} บาท`).join("\n");
    return { reply: `📋 รายการล่าสุด:\n${list}\n\nกรุณาไปที่หน้า "บันทึก" เพื่อลบรายการค่ะ`, action: "list" };
  }

  // === บันทึกรายการ → AI วิเคราะห์แล้ว ให้ user ยืนยัน ===
  if (aiIntent.intent === "record" && aiIntent.amount > 0 && aiIntent.amount <= 10000000) {
    const desc = aiIntent.description || msg;
    const amount = aiIntent.amount;
    const suggestedType = aiIntent.type || "unknown";
    const category = aiIntent.category || (suggestedType === "income" ? "รายได้อาชีพหลัก" : "อาหาร/ของใช้");

    // ถ้า AI มั่นใจสูง → บันทึกเลย
    if (aiIntent.confidence === "high" && suggestedType !== "unknown") {
      const today = toBuddhistYear(new Date());
      const saved = await Transaction.create({ userId, date: today, description: desc, amount, type: suggestedType, category });
      const typeLabel = suggestedType === "income" ? "📥 รายรับ" : "📤 รายจ่าย";
      return {
        reply: `✅ บันทึกแล้ว!\n${typeLabel}: ${desc}\n💰 จำนวน: ${amount.toLocaleString()} บาท\n📁 หมวด: ${category}\n📅 วันที่: ${today}`,
        action: "saved",
        transaction: { id: saved._id, date: today, description: desc, amount, type: suggestedType, category },
      };
    }

    // ถ้า AI ไม่มั่นใจ → สร้าง pending + ถาม user
    await PendingTx.deleteMany({ userId });
    await PendingTx.create({ userId, amount, description: desc, suggestedType });

    const suggestion = suggestedType === "income" ? "📥 AI แนะนำ: น่าจะเป็น *รายรับ*"
      : suggestedType === "expense" ? "📤 AI แนะนำ: น่าจะเป็น *รายจ่าย*"
      : "❓ AI ไม่แน่ใจว่าเป็นรายรับหรือรายจ่าย";

    return {
      reply: `💰 ${desc} ${amount.toLocaleString()} บาท\n${suggestion}\n\nกดเลือก: รายรับ / รายจ่าย / ยกเลิก`,
      action: "vision_financial",
    };
  }

  // 5. AI (OpenClaw → OpenRouter → Fallback)
  // ใช้ compact history: [สรุปเก่า] + [ข้อความล่าสุด] ประหยัด token
  let systemPrompt = await buildSystemPrompt(userId);
  // เพิ่มคำสั่งภาษาถิ่นถ้าเลือก
  if (dialect && dialect !== "central") {
    systemPrompt += getDialectPrompt(dialect as any);
  }
  const chatHistory = await getCompactHistory(userId);

  const aiResult = await askAI(msg, systemPrompt, chatHistory);
  if (aiResult) {
    return { reply: aiResult.reply, action: "chat" };
  }

  // 6. Fallback
  if (/ช่วย|วิธีใช้|ทำอะไรได้|สวัสดี|หวัดดี/.test(msg)) {
    return {
      reply: `สวัสดีค่ะ! ฉันช่วยคุณได้:\n\nบันทึกรายรับ: "ขายข้าว 3000 บาท"\nบันทึกรายจ่าย: "ซื้อปุ๋ย 500 บาท"\nดูสรุป: "สรุปยอด"\nดูรายการ: "ดูรายการล่าสุด"\n\nหรือจะคุยเรื่องอื่นก็ได้ค่ะ!`,
      action: "help",
    };
  }

  if (/แนะนำ|ออมเงิน|ลดค่าใช้จ่าย|เคล็ดลับ/.test(msg)) {
    const tips = [
      "กฎ 50/30/20: แบ่งรายได้ 50% จำเป็น, 30% ต้องการ, 20% ออม",
      "ปลูกผักกินเอง: ลดค่าอาหารได้เดือนละ 500-1,000 บาท",
      "จดทุกวัน: บันทึกรายจ่ายทุกวันจะเห็นจุดที่ลดได้",
      "ออมก่อนใช้: พอได้เงินมา แบ่งออมก่อน 10-20%",
      "กลุ่มออมทรัพย์: รวมกลุ่มออมกับเพื่อนบ้าน ช่วยกันดูแล",
    ];
    const pick = tips.sort(() => Math.random() - 0.5).slice(0, 3);
    return { reply: `คำแนะนำการเงิน:\n\n${pick.join("\n\n")}`, action: "advice" };
  }

  return {
    reply: `ขอบคุณที่คุยด้วยนะคะ\n\nถ้าต้องการบันทึกบัญชี ลองพิมพ์:\n"ขายข้าว 3000 บาท"\n"ซื้อปุ๋ย 500 บาท"\n"สรุปยอด"`,
    action: "chat",
  };
}

// --------- Confirm Pending Transaction ---------

async function confirmPendingTx(
  pending: any,
  type: "income" | "expense",
  userId: string
): Promise<AiResult> {
  const today = toBuddhistYear(new Date());
  const category = type === "income" ? "รายได้อาชีพหลัก" : "อาหาร/ของใช้";

  const saved = await Transaction.create({
    userId,
    date: today,
    description: pending.description,
    amount: pending.amount,
    type,
    category,
    slipFileId: pending.fileId || "", // เชื่อมกับ slip image
    note: pending.visionResult ? `AI วิเคราะห์: ${pending.description}` : "",
  });

  await PendingTx.deleteOne({ _id: pending._id });

  const typeLabel = type === "income" ? "รายรับ" : "รายจ่าย";
  return {
    reply: `บันทึกแล้ว!\n${typeLabel}: ${pending.description}\nจำนวน: ${pending.amount.toLocaleString()} บาท\nหมวด: ${category}\nวันที่: ${today}`,
    action: "saved",
    transaction: { id: saved._id, date: today, description: pending.description, amount: pending.amount, type, category },
  };
}

// --------- Handle Image ---------

/**
 * ประมวลผลรูปภาพ - วิเคราะห์ด้วย AI Vision
 * ถ้าเป็นเอกสารการเงิน → สร้าง pending tx รอยืนยัน
 */
export async function handleImage(
  imageBase64: string,
  mimeType: string,
  userId: string,
  source: string = "web"
): Promise<AiResult> {
  await connectDb();

  // 1. เก็บรูปลง R2 + MongoDB (ทุกรูปเก็บหมด ทั้งจาก Telegram และ Web)
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const filename = `${uuidv4()}.${ext}`;
  const buffer = Buffer.from(imageBase64, "base64");
  let fileDocId = "";

  try {
    const r2Key = await uploadToR2(userId, filename, buffer, mimeType);
    const fileDoc = await FileDoc.create({
      userId,
      filename,
      originalName: `${source}-${new Date().toISOString().slice(0, 10)}.${ext}`,
      mimeType,
      size: buffer.length,
      category: "รูปภาพ",
      description: `ส่งจาก ${source === "telegram" ? "Telegram" : "เว็บ"}`,
      r2Key,
    });
    fileDocId = fileDoc._id.toString();
  } catch (err) {
    console.error("[handleImage] R2 upload error:", err);
  }

  // 2. วิเคราะห์รูปด้วย AI Vision
  const result = await analyzeImage(imageBase64, mimeType);
  const reply = buildVisionReply(result);

  // 3. บันทึก chat
  await ChatMessage.create({ userId, role: "user", content: `[ส่งรูปภาพจาก ${source}]` });
  await ChatMessage.create({ userId, role: "assistant", content: reply, action: result.isFinancial ? "vision_financial" : "vision" });

  // 4. ถ้าเป็นเอกสารการเงิน → สร้าง pending tx + เก็บ visionResult + fileId
  if (result.isFinancial && result.amount && result.amount > 0 && result.amount <= 10000000) {
    await PendingTx.deleteMany({ userId });
    await PendingTx.create({
      userId,
      amount: result.amount,
      description: result.description || "จากรูปภาพ",
      suggestedType: result.type || "unknown",
      imageInfo: JSON.stringify({ from: result.from, to: result.to, date: result.date }),
      visionResult: JSON.stringify(result), // เก็บผลวิเคราะห์ทั้งหมด (audit trail)
      fileId: fileDocId, // เชื่อมกับ FileDoc
    });

    // อัพเดท FileDoc category ตามประเภท
    if (fileDocId) {
      const slipCat = result.type === "income" ? "slip เงินเข้า" : result.type === "expense" ? "slip เงินออก" : "ใบเสร็จ";
      await FileDoc.updateOne({ _id: fileDocId }, { $set: { category: slipCat, description: result.description || "จากรูปภาพ" } });
    }
  }

  return { reply, action: result.isFinancial ? "vision_financial" : "vision" };
}

// --------- Main Handlers (ใช้ร่วมทั้ง Web/Telegram) ---------

/**
 * จัดการข้อความ text
 */
export async function handleChat(message: string, userId: string, dialect?: string): Promise<AiResult> {
  await connectDb();
  await ChatMessage.create({ userId, role: "user", content: message });
  const result = await processMessage(message, userId, dialect);
  await ChatMessage.create({ userId, role: "assistant", content: result.reply, action: result.action });
  return result;
}

/**
 * จัดการรูปภาพ
 */
export async function handlePhoto(imageBase64: string, mimeType: string, userId: string, source: string = "web"): Promise<AiResult> {
  return handleImage(imageBase64, mimeType, userId, source);
}
