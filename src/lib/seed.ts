import { connectDb } from "./db";
import { User } from "./models/User";
import { Transaction } from "./models/Transaction";
import { ChatMessage } from "./models/ChatMessage";
import { ChatSummary } from "./models/ChatSummary";
import { PendingTx } from "./models/PendingTx";

// ===== Demo Users =====
const DEMO_USERS_DATA = [
  { demoId: "demo-1", name: "สมชาย", occupation: "ชาวนา", avatar: "🌾" },
  { demoId: "demo-2", name: "สมหญิง", occupation: "ค้าขาย", avatar: "🏪" },
  { demoId: "demo-3", name: "สมศักดิ์", occupation: "รับจ้างทั่วไป", avatar: "🔧" },
  { demoId: "demo-4", name: "สมใจ", occupation: "ทำสวน", avatar: "🌿" },
  { demoId: "demo-5", name: "สมปอง", occupation: "เลี้ยงสัตว์", avatar: "🐄" },
];

// ===== ข้อมูลรายรับ-รายจ่ายตามอาชีพ (สมจริงกับชาวบ้านไทย) =====

interface TxTemplate {
  desc: string;
  min: number;
  max: number;
  type: "income" | "expense";
  cat: string;
  freq: number; // ความถี่ต่อเดือน (โดยประมาณ)
  months?: number[]; // เฉพาะเดือนที่ระบุ (ถ้ามี) 1-12
}

// สมชาย - ชาวนา อีสาน ทำนาปี + นาปรัง + รับจ้างหน้าแล้ง
const FARMER: TxTemplate[] = [
  // รายได้
  { desc: "ขายข้าวเปลือก", min: 8000, max: 25000, type: "income", cat: "รายได้อาชีพหลัก", freq: 1, months: [11, 12, 1, 5, 6] },
  { desc: "ขายข้าวสาร", min: 500, max: 2000, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "ขายปลาจากนา", min: 200, max: 800, type: "income", cat: "รายได้อาชีพหลัก", freq: 1, months: [10, 11, 12] },
  { desc: "รับจ้างดำนา", min: 300, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 3, months: [6, 7, 8] },
  { desc: "รับจ้างเกี่ยวข้าว", min: 400, max: 600, type: "income", cat: "รายได้อาชีพหลัก", freq: 3, months: [11, 12] },
  { desc: "เงินสงเคราะห์ผู้สูงอายุ", min: 600, max: 600, type: "income", cat: "สวัสดิการ", freq: 1 },
  { desc: "ขายผักริมรั้ว", min: 50, max: 200, type: "income", cat: "รายได้อาชีพหลัก", freq: 4 },
  // รายจ่าย
  { desc: "ค่าปุ๋ยเคมี", min: 800, max: 2500, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1, months: [5, 6, 7, 8, 9] },
  { desc: "ค่าปุ๋ยอินทรีย์", min: 300, max: 800, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1, months: [6, 7] },
  { desc: "ค่ายาฆ่าแมลง", min: 200, max: 600, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1, months: [7, 8, 9] },
  { desc: "ค่าน้ำมันรถไถ", min: 300, max: 800, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 2, months: [5, 6, 11] },
  { desc: "ค่าเมล็ดพันธุ์ข้าว", min: 500, max: 1500, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1, months: [5, 6] },
  { desc: "ค่าข้าวสาร", min: 200, max: 500, type: "expense", cat: "อาหาร/ของใช้", freq: 2 },
  { desc: "ค่ากับข้าว", min: 100, max: 300, type: "expense", cat: "อาหาร/ของใช้", freq: 8 },
  { desc: "ค่าไฟฟ้า", min: 200, max: 500, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำประปา", min: 50, max: 150, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าแก๊สหุงต้ม", min: 300, max: 400, type: "expense", cat: "อาหาร/ของใช้", freq: 0.5 },
  { desc: "ทำบุญวัด", min: 20, max: 200, type: "expense", cat: "งานสังคม", freq: 2 },
  { desc: "ซื้อยาสามัญ", min: 50, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าโทรศัพท์/เน็ต", min: 100, max: 300, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ซองงานแต่ง", min: 200, max: 500, type: "expense", cat: "งานสังคม", freq: 0.3 },
  { desc: "ซองงานศพ", min: 100, max: 300, type: "expense", cat: "งานสังคม", freq: 0.3 },
  { desc: "ค่าเหล้าเบียร์", min: 50, max: 200, type: "expense", cat: "พักผ่อน", freq: 3 },
  { desc: "ค่าลอตเตอรี่", min: 80, max: 160, type: "expense", cat: "พักผ่อน", freq: 2 },
];

// สมหญิง - แม่ค้าขายของชำ/ขายกับข้าวตลาดเช้า
const TRADER: TxTemplate[] = [
  { desc: "ขายของชำ", min: 500, max: 2500, type: "income", cat: "รายได้อาชีพหลัก", freq: 20 },
  { desc: "ขายกับข้าวตลาดเช้า", min: 300, max: 1200, type: "income", cat: "รายได้อาชีพหลัก", freq: 15 },
  { desc: "ขายน้ำ/ขนม", min: 100, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 10 },
  { desc: "ซื้อวัตถุดิบมาทำ", min: 200, max: 1000, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 15 },
  { desc: "ซื้อสินค้ามาขาย", min: 500, max: 3000, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 4 },
  { desc: "ค่าเช่าแผงตลาด", min: 100, max: 200, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 20 },
  { desc: "ค่าน้ำแข็ง", min: 30, max: 80, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 15 },
  { desc: "ค่าแก๊สหุงต้ม", min: 300, max: 400, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1 },
  { desc: "ค่ากับข้าวในบ้าน", min: 80, max: 250, type: "expense", cat: "อาหาร/ของใช้", freq: 10 },
  { desc: "ค่าไฟฟ้า", min: 300, max: 700, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำประปา", min: 80, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำมันรถมอไซค์", min: 100, max: 300, type: "expense", cat: "อาหาร/ของใช้", freq: 4 },
  { desc: "ค่าโทรศัพท์/เน็ต", min: 200, max: 400, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ทำบุญตักบาตร", min: 20, max: 100, type: "expense", cat: "งานสังคม", freq: 4 },
  { desc: "ค่าเรียนลูก", min: 500, max: 2000, type: "expense", cat: "การศึกษา", freq: 0.5, months: [5, 6, 11] },
  { desc: "ซื้อของใช้ในบ้าน", min: 100, max: 500, type: "expense", cat: "อาหาร/ของใช้", freq: 2 },
  { desc: "ค่าลอตเตอรี่", min: 80, max: 80, type: "expense", cat: "พักผ่อน", freq: 2 },
  { desc: "ซองงาน", min: 200, max: 500, type: "expense", cat: "งานสังคม", freq: 0.4 },
];

// สมศักดิ์ - รับจ้างทั่วไป ก่อสร้าง ซ่อมบ้าน ตัดหญ้า
const LABORER: TxTemplate[] = [
  { desc: "รับจ้างก่อสร้าง", min: 300, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 12 },
  { desc: "รับจ้างซ่อมบ้าน", min: 500, max: 2000, type: "income", cat: "รายได้อาชีพหลัก", freq: 3 },
  { desc: "รับจ้างตัดหญ้า", min: 200, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 4 },
  { desc: "รับจ้างทาสี", min: 800, max: 3000, type: "income", cat: "รายได้อาชีพหลัก", freq: 1 },
  { desc: "รับจ้างขุดดิน", min: 300, max: 600, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "รับจ้างล้างรถ", min: 100, max: 200, type: "income", cat: "รายได้อาชีพหลัก", freq: 3 },
  { desc: "ค่าเครื่องมือช่าง", min: 100, max: 800, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 0.5 },
  { desc: "ค่าน้ำมันเครื่องตัดหญ้า", min: 50, max: 150, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 2 },
  { desc: "ค่ากับข้าว", min: 60, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 15 },
  { desc: "ค่าข้าวกลางวัน", min: 40, max: 80, type: "expense", cat: "อาหาร/ของใช้", freq: 15 },
  { desc: "ค่าไฟฟ้า", min: 150, max: 400, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำประปา", min: 50, max: 120, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าเหล้า", min: 50, max: 300, type: "expense", cat: "พักผ่อน", freq: 4 },
  { desc: "ค่าบุหรี่", min: 60, max: 120, type: "expense", cat: "พักผ่อน", freq: 4 },
  { desc: "ค่าโทรศัพท์", min: 100, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ทำบุญวัด", min: 20, max: 100, type: "expense", cat: "งานสังคม", freq: 2 },
  { desc: "ค่ายาแก้ปวด", min: 30, max: 100, type: "expense", cat: "อาหาร/ของใช้", freq: 2 },
  { desc: "ค่าลอตเตอรี่", min: 80, max: 160, type: "expense", cat: "พักผ่อน", freq: 2 },
  { desc: "ซองงาน", min: 100, max: 300, type: "expense", cat: "งานสังคม", freq: 0.3 },
];

// สมใจ - ทำสวน ปลูกผัก ผลไม้ สมุนไพร
const GARDENER: TxTemplate[] = [
  { desc: "ขายผักสวนครัว", min: 100, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 10 },
  { desc: "ขายมะนาว", min: 200, max: 800, type: "income", cat: "รายได้อาชีพหลัก", freq: 3, months: [3, 4, 5, 6] },
  { desc: "ขายมะม่วง", min: 300, max: 1500, type: "income", cat: "รายได้อาชีพหลัก", freq: 2, months: [3, 4, 5] },
  { desc: "ขายกล้วย", min: 100, max: 400, type: "income", cat: "รายได้อาชีพหลัก", freq: 3 },
  { desc: "ขายสมุนไพร", min: 100, max: 600, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "ขายดอกไม้", min: 50, max: 300, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "ขายพริก/ตะไคร้", min: 50, max: 200, type: "income", cat: "รายได้อาชีพหลัก", freq: 5 },
  { desc: "เงินผู้สูงอายุ", min: 600, max: 600, type: "income", cat: "สวัสดิการ", freq: 1 },
  { desc: "ค่าเมล็ดพันธุ์", min: 50, max: 300, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 2 },
  { desc: "ค่าปุ๋ย", min: 200, max: 600, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1 },
  { desc: "ค่าสายยางรดน้ำ", min: 100, max: 400, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 0.3 },
  { desc: "ค่ากับข้าว", min: 60, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 8 },
  { desc: "ค่าไฟฟ้า", min: 150, max: 350, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำประปา", min: 50, max: 150, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าโทรศัพท์", min: 100, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ทำบุญใส่บาตร", min: 20, max: 50, type: "expense", cat: "งานสังคม", freq: 8 },
  { desc: "ซื้อยาสมุนไพร", min: 30, max: 150, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าลอตเตอรี่", min: 80, max: 80, type: "expense", cat: "พักผ่อน", freq: 1 },
];

// สมปอง - เลี้ยงวัว ไก่ ปลา หมู
const LIVESTOCK: TxTemplate[] = [
  { desc: "ขายไข่ไก่", min: 100, max: 500, type: "income", cat: "รายได้อาชีพหลัก", freq: 8 },
  { desc: "ขายไก่", min: 200, max: 800, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "ขายลูกวัว", min: 8000, max: 20000, type: "income", cat: "รายได้อาชีพหลัก", freq: 0.3, months: [1, 2, 3, 10, 11, 12] },
  { desc: "ขายน้ำนมวัว", min: 300, max: 800, type: "income", cat: "รายได้อาชีพหลัก", freq: 6 },
  { desc: "ขายปลานิล", min: 200, max: 1000, type: "income", cat: "รายได้อาชีพหลัก", freq: 2 },
  { desc: "ขายมูลวัว", min: 100, max: 400, type: "income", cat: "รายได้อาชีพหลัก", freq: 1 },
  { desc: "ค่าอาหารสัตว์", min: 300, max: 1500, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 4 },
  { desc: "ค่ารำข้าว", min: 200, max: 600, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 3 },
  { desc: "ค่ายารักษาสัตว์", min: 100, max: 500, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1 },
  { desc: "ค่าวัคซีนสัตว์", min: 200, max: 800, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 0.5, months: [3, 4, 9, 10] },
  { desc: "ค่าอาหารลูกปลา", min: 100, max: 300, type: "expense", cat: "ค่าประกอบอาชีพ", freq: 1 },
  { desc: "ค่ากับข้าว", min: 80, max: 250, type: "expense", cat: "อาหาร/ของใช้", freq: 8 },
  { desc: "ค่าไฟฟ้า", min: 200, max: 500, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำประปา", min: 50, max: 150, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ค่าน้ำมันรถ", min: 200, max: 500, type: "expense", cat: "อาหาร/ของใช้", freq: 2 },
  { desc: "ค่าโทรศัพท์", min: 100, max: 200, type: "expense", cat: "อาหาร/ของใช้", freq: 1 },
  { desc: "ทำบุญวัด", min: 20, max: 200, type: "expense", cat: "งานสังคม", freq: 2 },
  { desc: "ค่าลอตเตอรี่", min: 80, max: 160, type: "expense", cat: "พักผ่อน", freq: 2 },
  { desc: "ซองงาน", min: 200, max: 500, type: "expense", cat: "งานสังคม", freq: 0.3 },
];

const USER_TEMPLATES: Record<string, TxTemplate[]> = {
  "demo-1": FARMER,
  "demo-2": TRADER,
  "demo-3": LABORER,
  "demo-4": GARDENER,
  "demo-5": LIVESTOCK,
};

// ===== Helper =====

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}

function toBuddhistDate(date: Date): string {
  const y = date.getFullYear() + 543;
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateTransactions(userId: string, templates: TxTemplate[]): Array<{
  userId: string; date: string; description: string; amount: number; type: "income" | "expense"; category: string;
}> {
  const txs: Array<any> = [];
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // วนทุกเดือน 12 เดือนย้อนหลัง
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now);
    monthDate.setMonth(now.getMonth() - m);
    const month = monthDate.getMonth() + 1; // 1-12
    const year = monthDate.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    for (const t of templates) {
      // ตรวจว่าเดือนนี้มี template นี้ไหม
      if (t.months && !t.months.includes(month)) continue;

      // สุ่มจำนวนครั้งในเดือนนี้ตาม freq
      let count: number;
      if (t.freq >= 1) {
        // สุ่ม ± 30% ของ freq
        count = Math.max(1, Math.round(t.freq * (0.7 + Math.random() * 0.6)));
      } else {
        // freq < 1 = ไม่เกิดทุกเดือน
        count = Math.random() < t.freq ? 1 : 0;
      }

      for (let i = 0; i < count; i++) {
        const day = rand(1, daysInMonth);
        const date = new Date(year, month - 1, day);
        if (date > now) continue; // ไม่สร้างอนาคต

        const amount = roundTo10(rand(t.min, t.max));
        txs.push({
          userId,
          date: toBuddhistDate(date),
          description: t.desc,
          amount,
          type: t.type,
          category: t.cat,
        });
      }
    }
  }

  // เรียงตามวันที่
  txs.sort((a: any, b: any) => a.date.localeCompare(b.date));
  return txs;
}

// ===== Main Seed =====

export async function seedDemoData() {
  await connectDb();
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  await User.insertMany(DEMO_USERS_DATA);

  for (const [userId, templates] of Object.entries(USER_TEMPLATES)) {
    const txs = generateTransactions(userId, templates);
    if (txs.length > 0) {
      await Transaction.insertMany(txs);
    }
    console.log(`✅ ${userId}: ${txs.length} รายการ`);
  }

  console.log("✅ Seed เสร็จแล้ว");
}

/**
 * ลบข้อมูลทั้งหมดแล้ว seed ใหม่
 */
export async function resetAndSeed() {
  await connectDb();

  // ลบทุกอย่าง
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    ChatMessage.deleteMany({}),
    ChatSummary.deleteMany({}),
    PendingTx.deleteMany({}),
  ]);

  console.log("🗑️ ลบข้อมูลเก่าทั้งหมดแล้ว");

  // seed ใหม่ (ต้อง reset existingUsers check)
  await User.insertMany(DEMO_USERS_DATA);

  for (const [userId, templates] of Object.entries(USER_TEMPLATES)) {
    const txs = generateTransactions(userId, templates);
    if (txs.length > 0) {
      await Transaction.insertMany(txs);
    }
    console.log(`✅ ${userId}: ${txs.length} รายการ`);
  }

  console.log("✅ Seed ใหม่เสร็จแล้ว");
}
