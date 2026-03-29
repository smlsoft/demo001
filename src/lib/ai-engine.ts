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
  if (amount <= 0) return null;

  const incomeKw = ["ขาย", "ได้เงิน", "รับเงิน", "เงินเดือน", "ค่าจ้าง", "รับจ้าง", "สวัสดิการ", "เงินช่วย", "รายได้", "ปันผล"];
  const expenseKw = ["ซื้อ", "จ่าย", "ค่า", "ซ่อม", "ทำบุญ", "บริจาค", "เสีย"];

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
  const [incomeResult, expenseResult, recentTxs] = await Promise.all([
    Transaction.aggregate([{ $match: { userId, type: "income" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Transaction.aggregate([{ $match: { userId, type: "expense" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const totalIncome = incomeResult[0]?.total || 0;
  const totalExpense = expenseResult[0]?.total || 0;
  const user = DEMO_USERS.find((u) => u.id === userId);

  const recent = recentTxs.map((t: any) =>
    `${t.type === "income" ? "รายรับ" : "รายจ่าย"}: ${t.description} ${t.amount} บาท (${t.date})`
  ).join("\n");

  return `คุณคือ "น้องบัญชี" เลขาส่วนตัวประจำครัวเรือนของ${user?.name || "ผู้ใช้"}

กฎสำคัญ:
- ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาจีนหรืออังกฤษ
- จำบทสนทนาที่ผ่านมาได้ ถ้าเขาเคยเล่าอะไรไว้ ให้อ้างอิงถึงได้
- ทำตัวเหมือนเลขาที่ดี: จำได้ว่าเจ้านายชอบอะไร ไม่ชอบอะไร เคยบอกอะไรไว้
- พูดสุภาพ อบอุ่น เหมือนคนใกล้ชิดที่ห่วงใย
- ให้คำแนะนำเรื่องการเงินเชิงรุก เช่น เตือนถ้ารายจ่ายเยอะ แนะนำวิธีออม

ข้อมูลเจ้านาย:
- ชื่อ: ${user?.name || "ไม่ทราบ"}
- อาชีพ: ${user?.occupation || "ไม่ทราบ"}
- รายรับรวม: ${totalIncome.toLocaleString()} บาท
- รายจ่ายรวม: ${totalExpense.toLocaleString()} บาท
- คงเหลือ: ${(totalIncome - totalExpense).toLocaleString()} บาท

รายการล่าสุด:
${recent || "(ยังไม่มี)"}

วันนี้: ${toBuddhistYear(new Date())}

สิ่งที่น้องบัญชีทำได้:
- จดบันทึกรายรับ-รายจ่ายให้ (เขาจะพิมพ์มา ระบบจัดการให้อัตโนมัติ)
- สรุปยอดบัญชี
- อ่านรูป slip/ใบเสร็จ
- ให้คำแนะนำการเงิน การออม เรื่องทั่วไป
- คุยเป็นเพื่อน ให้กำลังใจ
- จำเรื่องที่คุยกันไว้ และอ้างอิงได้ในบทสนทนาถัดไป`;
}

// --------- Main Process Message ---------

export async function processMessage(
  message: string,
  userId: string
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

  // 1. สรุปยอด
  if (/สรุป|รายงาน|ยอด|เหลือเท่าไ|คงเหลือ|เงินเท่าไ/.test(msg)) {
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
      reply: `สรุปบัญชีของคุณ:\nรายรับรวม: ${totalIncome.toLocaleString()} บาท\nรายจ่ายรวม: ${totalExpense.toLocaleString()} บาท\nคงเหลือ: ${balance.toLocaleString()} บาท${advice}`,
      action: "summary",
    };
  }

  // 2. ดูรายการ
  if (/รายการ|ล่าสุด|ดูบัญชี|ประวัติ/.test(msg)) {
    const recent = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    if (recent.length === 0) return { reply: "ยังไม่มีรายการ ลองพิมพ์ 'ขายข้าว 3000 บาท' เพื่อเริ่มบันทึก!", action: "list" };
    const list = recent.map((t: any) => `${t.type === "income" ? "รายรับ" : "รายจ่าย"}: ${t.description} - ${t.amount.toLocaleString()} บาท (${t.date})`).join("\n");
    return { reply: `รายการล่าสุด:\n${list}`, action: "list" };
  }

  // 3. Transaction parsing (built-in - แม่นยำ)
  const tx = parseTransaction(msg);
  if (tx) {
    const today = toBuddhistYear(new Date());
    const saved = await Transaction.create({ userId, date: today, description: tx.description, amount: tx.amount, type: tx.type, category: tx.category });
    const typeLabel = tx.type === "income" ? "รายรับ" : "รายจ่าย";
    return {
      reply: `บันทึกแล้ว!\n${typeLabel}: ${tx.description}\nจำนวน: ${tx.amount.toLocaleString()} บาท\nหมวด: ${tx.category}\nวันที่: ${today}`,
      action: "saved",
      transaction: { id: saved._id, date: today, ...tx },
    };
  }

  // 4. มีตัวเลขแต่ไม่ชัดเจน
  if (/\d+/.test(msg)) {
    const m = msg.match(/(\d[\d,]*)/);
    if (m) {
      return {
        reply: `เห็นจำนวน ${m[1]} บาท แต่ไม่แน่ใจว่าเป็นรายรับหรือรายจ่าย\n\nลองพิมพ์:\n"ขายข้าว ${m[1]} บาท" (รายรับ)\n"ซื้อปุ๋ย ${m[1]} บาท" (รายจ่าย)`,
        action: "clarify",
      };
    }
  }

  // 5. AI (OpenClaw → OpenRouter → Fallback)
  // ใช้ compact history: [สรุปเก่า] + [ข้อความล่าสุด] ประหยัด token
  const systemPrompt = await buildSystemPrompt(userId);
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

  try {
    const r2Key = await uploadToR2(userId, filename, buffer, mimeType);
    await FileDoc.create({
      userId,
      filename,
      originalName: `${source}-${new Date().toISOString().slice(0, 10)}.${ext}`,
      mimeType,
      size: buffer.length,
      category: "รูปภาพ",
      description: `ส่งจาก ${source === "telegram" ? "Telegram" : "เว็บ"}`,
      r2Key,
    });
  } catch (err) {
    console.error("[handleImage] R2 upload error:", err);
    // ไม่ block flow ถ้า upload ล้มเหลว
  }

  // 2. วิเคราะห์รูปด้วย AI Vision
  const result = await analyzeImage(imageBase64, mimeType);
  const reply = buildVisionReply(result);

  // 3. บันทึก chat
  await ChatMessage.create({ userId, role: "user", content: `[ส่งรูปภาพจาก ${source}]` });
  await ChatMessage.create({ userId, role: "assistant", content: reply, action: result.isFinancial ? "vision_financial" : "vision" });

  // 4. ถ้าเป็นเอกสารการเงิน → สร้าง pending tx รอยืนยัน
  if (result.isFinancial && result.amount && result.amount > 0) {
    await PendingTx.deleteMany({ userId });
    await PendingTx.create({
      userId,
      amount: result.amount,
      description: result.description || "จากรูปภาพ",
      suggestedType: result.type || "unknown",
      imageInfo: JSON.stringify({ from: result.from, to: result.to, date: result.date }),
    });
  }

  return { reply, action: result.isFinancial ? "vision_financial" : "vision" };
}

// --------- Main Handlers (ใช้ร่วมทั้ง Web/Telegram) ---------

/**
 * จัดการข้อความ text
 */
export async function handleChat(message: string, userId: string): Promise<AiResult> {
  await connectDb();
  await ChatMessage.create({ userId, role: "user", content: message });
  const result = await processMessage(message, userId);
  await ChatMessage.create({ userId, role: "assistant", content: result.reply, action: result.action });
  return result;
}

/**
 * จัดการรูปภาพ
 */
export async function handlePhoto(imageBase64: string, mimeType: string, userId: string, source: string = "web"): Promise<AiResult> {
  return handleImage(imageBase64, mimeType, userId, source);
}
