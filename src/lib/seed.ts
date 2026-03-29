import { connectDb } from "./db";
import { User } from "./models/User";
import { Transaction } from "./models/Transaction";
import { ChatMessage } from "./models/ChatMessage";
import { ChatSummary } from "./models/ChatSummary";
import { PendingTx } from "./models/PendingTx";
import { SavingsGoal } from "./models/SavingsGoal";
import { Budget } from "./models/Budget";
import { Reminder } from "./models/Reminder";
import { RecurringTx } from "./models/RecurringTx";
import { Debt } from "./models/Debt";
import { SavingsGroup, GroupDeposit } from "./models/SavingsGroup";
import { Achievement } from "./models/Achievement";

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

// Seeded random — ให้ผลเหมือนเดิมทุกครั้ง (deterministic)
let _seed = 12345;
function seededRand(min: number, max: number): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return min + (_seed % (max - min + 1));
}

function rand(min: number, max: number): number {
  return seededRand(min, max);
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

      // กำหนดจำนวนครั้งตาม freq (deterministic ไม่สุ่ม)
      let count: number;
      if (t.freq >= 1) {
        // ± variation ตาม seed
        const variation = seededRand(70, 130) / 100;
        count = Math.max(1, Math.round(t.freq * variation));
      } else {
        // freq < 1 = ไม่เกิดทุกเดือน → ใช้ seed ตัดสิน
        count = seededRand(1, 100) <= t.freq * 100 ? 1 : 0;
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

// ===== ข้อมูลตัวอย่างระบบใหม่ =====

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear() + 543}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function seedSavingsGoals() {
  const goals = [
    { userId: "demo-1", name: "ซื้อรถไถมือสอง", targetAmount: 80000, currentAmount: 32000, icon: "🚜", deadline: "" },
    { userId: "demo-1", name: "เงินสำรองฉุกเฉิน 3 เดือน", targetAmount: 15000, currentAmount: 8500, icon: "🏦", deadline: "" },
    { userId: "demo-2", name: "ขยายร้านค้า", targetAmount: 50000, currentAmount: 28000, icon: "🏪", deadline: "" },
    { userId: "demo-2", name: "ทุนการศึกษาลูก", targetAmount: 30000, currentAmount: 12000, icon: "🎓", deadline: "" },
    { userId: "demo-3", name: "ซื้อเครื่องมือช่างชุดใหม่", targetAmount: 8000, currentAmount: 5500, icon: "🔧", deadline: "" },
    { userId: "demo-4", name: "สร้างโรงเรือนปลูกผัก", targetAmount: 25000, currentAmount: 18000, icon: "🌿", deadline: "" },
    { userId: "demo-4", name: "ซื้อระบบน้ำหยด", targetAmount: 12000, currentAmount: 12000, icon: "💧", deadline: "" },
    { userId: "demo-5", name: "ซื้อวัวเพิ่ม 2 ตัว", targetAmount: 40000, currentAmount: 15000, icon: "🐄", deadline: "" },
    { userId: "demo-5", name: "ซ่อมคอกสัตว์", targetAmount: 10000, currentAmount: 4000, icon: "🏠", deadline: "" },
  ];
  await SavingsGoal.insertMany(goals);
  console.log(`✅ SavingsGoals: ${goals.length} รายการ`);
}

async function seedBudgets() {
  const month = currentMonth();
  const budgets = [
    { userId: "demo-1", category: "อาหาร/ของใช้", monthlyLimit: 5000, month },
    { userId: "demo-1", category: "ค่าประกอบอาชีพ", monthlyLimit: 8000, month },
    { userId: "demo-1", category: "งานสังคม", monthlyLimit: 1000, month },
    { userId: "demo-2", category: "ค่าประกอบอาชีพ", monthlyLimit: 15000, month },
    { userId: "demo-2", category: "อาหาร/ของใช้", monthlyLimit: 6000, month },
    { userId: "demo-2", category: "การศึกษา", monthlyLimit: 2000, month },
    { userId: "demo-3", category: "อาหาร/ของใช้", monthlyLimit: 4000, month },
    { userId: "demo-3", category: "พักผ่อน", monthlyLimit: 1500, month },
    { userId: "demo-4", category: "ค่าประกอบอาชีพ", monthlyLimit: 3000, month },
    { userId: "demo-4", category: "อาหาร/ของใช้", monthlyLimit: 4000, month },
    { userId: "demo-5", category: "ค่าประกอบอาชีพ", monthlyLimit: 10000, month },
    { userId: "demo-5", category: "อาหาร/ของใช้", monthlyLimit: 5000, month },
  ];
  await Budget.insertMany(budgets);
  console.log(`✅ Budgets: ${budgets.length} รายการ`);
}

async function seedReminders() {
  const reminders = [
    { userId: "demo-1", title: "จ่ายค่าไฟฟ้า", amount: 350, dueDay: 20, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
    { userId: "demo-1", title: "จ่ายค่าน้ำประปา", amount: 100, dueDay: 15, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
    { userId: "demo-1", title: "รับเงินผู้สูงอายุ", amount: 600, dueDay: 10, category: "สวัสดิการ", type: "income" as const, active: true },
    { userId: "demo-2", title: "จ่ายค่าเช่าแผงตลาด", amount: 3000, dueDay: 1, category: "ค่าประกอบอาชีพ", type: "expense" as const, active: true },
    { userId: "demo-2", title: "จ่ายค่าไฟฟ้า", amount: 500, dueDay: 18, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
    { userId: "demo-3", title: "จ่ายค่าไฟฟ้า", amount: 250, dueDay: 20, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
    { userId: "demo-4", title: "จ่ายค่าน้ำประปา", amount: 120, dueDay: 15, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
    { userId: "demo-5", title: "ซื้ออาหารสัตว์", amount: 1200, dueDay: 5, category: "ค่าประกอบอาชีพ", type: "expense" as const, active: true },
    { userId: "demo-5", title: "จ่ายค่าไฟฟ้า", amount: 400, dueDay: 20, category: "อาหาร/ของใช้", type: "expense" as const, active: true },
  ];
  await Reminder.insertMany(reminders);
  console.log(`✅ Reminders: ${reminders.length} รายการ`);
}

async function seedRecurringTx() {
  const items = [
    { userId: "demo-1", description: "ค่าไฟฟ้า", amount: 350, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 20, active: true },
    { userId: "demo-1", description: "ค่าน้ำประปา", amount: 100, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 15, active: true },
    { userId: "demo-1", description: "ค่าโทรศัพท์", amount: 200, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 25, active: true },
    { userId: "demo-2", description: "ค่าเช่าแผง", amount: 3000, type: "expense" as const, category: "ค่าประกอบอาชีพ", dueDay: 1, active: true },
    { userId: "demo-2", description: "ค่าไฟฟ้า", amount: 500, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 18, active: true },
    { userId: "demo-3", description: "ค่าไฟฟ้า", amount: 250, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 20, active: true },
    { userId: "demo-4", description: "ค่าน้ำ", amount: 120, type: "expense" as const, category: "อาหาร/ของใช้", dueDay: 15, active: true },
    { userId: "demo-5", description: "ค่าอาหารสัตว์", amount: 1200, type: "expense" as const, category: "ค่าประกอบอาชีพ", dueDay: 5, active: true },
  ];
  await RecurringTx.insertMany(items);
  console.log(`✅ RecurringTx: ${items.length} รายการ`);
}

async function seedDebts() {
  const debts = [
    { userId: "demo-1", creditor: "ธ.ก.ส.", totalAmount: 50000, paidAmount: 20000, monthlyPayment: 2500, installments: 20, paidInstallments: 8, dueDay: 5, startDate: "2568-08-01", note: "กู้ซื้อปุ๋ยและเมล็ดพันธุ์", active: true },
    { userId: "demo-1", creditor: "กองทุนหมู่บ้าน", totalAmount: 20000, paidAmount: 15000, monthlyPayment: 2500, installments: 8, paidInstallments: 6, dueDay: 15, startDate: "2568-10-01", note: "กู้ซ่อมบ้าน", active: true },
    { userId: "demo-2", creditor: "ธนาคารออมสิน", totalAmount: 30000, paidAmount: 10000, monthlyPayment: 2000, installments: 15, paidInstallments: 5, dueDay: 10, startDate: "2568-11-01", note: "กู้ขยายร้าน", active: true },
    { userId: "demo-3", creditor: "เพื่อนบ้าน (ลุงสมาน)", totalAmount: 5000, paidAmount: 3000, monthlyPayment: 1000, installments: 5, paidInstallments: 3, dueDay: 1, startDate: "2569-01-01", note: "ยืมซ่อมรถ", active: true },
    { userId: "demo-5", creditor: "สหกรณ์การเกษตร", totalAmount: 40000, paidAmount: 8000, monthlyPayment: 2000, installments: 20, paidInstallments: 4, dueDay: 20, startDate: "2568-12-01", note: "กู้ซื้อวัว", active: true },
    { userId: "demo-5", creditor: "ธ.ก.ส.", totalAmount: 15000, paidAmount: 15000, monthlyPayment: 2500, installments: 6, paidInstallments: 6, dueDay: 5, startDate: "2568-04-01", note: "กู้ซื้ออาหารสัตว์", active: false },
  ];
  await Debt.insertMany(debts);
  console.log(`✅ Debts: ${debts.length} รายการ`);
}

async function seedSavingsGroups() {
  const group = await SavingsGroup.create({
    name: "กลุ่มออมทรัพย์บ้านสุขสันต์",
    description: "ออมกันเดือนละ 500 บาท เพื่อเป็นเงินทุนหมุนเวียน",
    members: ["demo-1", "demo-2", "demo-4", "demo-5"],
    targetPerMember: 6000,
    createdBy: "demo-1",
  });

  const deposits = [
    { groupId: group._id.toString(), userId: "demo-1", amount: 500, date: "2569-01-15", note: "งวดเดือน ม.ค." },
    { groupId: group._id.toString(), userId: "demo-2", amount: 500, date: "2569-01-15", note: "งวดเดือน ม.ค." },
    { groupId: group._id.toString(), userId: "demo-4", amount: 500, date: "2569-01-16", note: "งวดเดือน ม.ค." },
    { groupId: group._id.toString(), userId: "demo-5", amount: 500, date: "2569-01-18", note: "งวดเดือน ม.ค." },
    { groupId: group._id.toString(), userId: "demo-1", amount: 500, date: "2569-02-14", note: "งวดเดือน ก.พ." },
    { groupId: group._id.toString(), userId: "demo-2", amount: 500, date: "2569-02-14", note: "งวดเดือน ก.พ." },
    { groupId: group._id.toString(), userId: "demo-4", amount: 500, date: "2569-02-15", note: "งวดเดือน ก.พ." },
    { groupId: group._id.toString(), userId: "demo-5", amount: 500, date: "2569-02-16", note: "งวดเดือน ก.พ." },
    { groupId: group._id.toString(), userId: "demo-1", amount: 500, date: "2569-03-15", note: "งวดเดือน มี.ค." },
    { groupId: group._id.toString(), userId: "demo-2", amount: 1000, date: "2569-03-15", note: "งวดเดือน มี.ค. + เพิ่ม" },
    { groupId: group._id.toString(), userId: "demo-4", amount: 500, date: "2569-03-16", note: "งวดเดือน มี.ค." },
  ];
  await GroupDeposit.insertMany(deposits);
  console.log(`✅ SavingsGroup: 1 กลุ่ม + ${deposits.length} ฝากเงิน`);
}

async function seedAchievements() {
  const achievements = [
    { userId: "demo-1", type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐" },
    { userId: "demo-1", type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝" },
    { userId: "demo-1", type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉" },
    { userId: "demo-1", type: "tx_100", title: "นักบัญชีมืออาชีพ", icon: "🥇" },
    { userId: "demo-1", type: "streak_7", title: "จดบัญชีครบ 7 วัน", icon: "🔥" },
    { userId: "demo-2", type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐" },
    { userId: "demo-2", type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝" },
    { userId: "demo-2", type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉" },
    { userId: "demo-2", type: "tx_100", title: "นักบัญชีมืออาชีพ", icon: "🥇" },
    { userId: "demo-2", type: "saver", title: "นักออม", icon: "🐷" },
    { userId: "demo-3", type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐" },
    { userId: "demo-3", type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝" },
    { userId: "demo-3", type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉" },
    { userId: "demo-4", type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐" },
    { userId: "demo-4", type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝" },
    { userId: "demo-4", type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉" },
    { userId: "demo-4", type: "tx_100", title: "นักบัญชีมืออาชีพ", icon: "🥇" },
    { userId: "demo-4", type: "saver", title: "นักออม", icon: "🐷" },
    { userId: "demo-4", type: "super_saver", title: "ซุปเปอร์นักออม", icon: "🏆" },
    { userId: "demo-5", type: "first_tx", title: "เริ่มต้นดี!", icon: "⭐" },
    { userId: "demo-5", type: "tx_10", title: "จดครบ 10 รายการ", icon: "📝" },
    { userId: "demo-5", type: "tx_50", title: "นักบัญชีมือใหม่", icon: "🥉" },
  ];
  await Achievement.insertMany(achievements);
  console.log(`✅ Achievements: ${achievements.length} เหรียญ`);
}

// ===== Main Seed =====

export async function seedDemoData() {
  await connectDb();
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  await User.insertMany(DEMO_USERS_DATA);

  for (const [userId, templates] of Object.entries(USER_TEMPLATES)) {
    // Reset seed ตาม userId → ข้อมูลเหมือนเดิมทุกครั้ง
    _seed = userId.charCodeAt(5) * 10000 + 12345;
    const txs = generateTransactions(userId, templates);
    if (txs.length > 0) {
      await Transaction.insertMany(txs);
    }
    console.log(`✅ ${userId}: ${txs.length} รายการ`);
  }

  // seed ระบบใหม่ทั้งหมด
  await Promise.all([
    seedSavingsGoals(),
    seedBudgets(),
    seedReminders(),
    seedRecurringTx(),
    seedDebts(),
    seedAchievements(),
  ]);
  await seedSavingsGroups(); // ต้อง await เพราะต้องรู้ group._id

  console.log("✅ Seed เสร็จแล้ว (ทุกระบบ)");
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
    SavingsGoal.deleteMany({}),
    Budget.deleteMany({}),
    Reminder.deleteMany({}),
    RecurringTx.deleteMany({}),
    Debt.deleteMany({}),
    SavingsGroup.deleteMany({}),
    GroupDeposit.deleteMany({}),
    Achievement.deleteMany({}),
  ]);

  console.log("🗑️ ลบข้อมูลเก่าทั้งหมดแล้ว");

  // seed ใหม่
  await User.insertMany(DEMO_USERS_DATA);

  for (const [userId, templates] of Object.entries(USER_TEMPLATES)) {
    _seed = userId.charCodeAt(5) * 10000 + 12345;
    const txs = generateTransactions(userId, templates);
    if (txs.length > 0) {
      await Transaction.insertMany(txs);
    }
    console.log(`✅ ${userId}: ${txs.length} รายการ`);
  }

  await Promise.all([
    seedSavingsGoals(),
    seedBudgets(),
    seedReminders(),
    seedRecurringTx(),
    seedDebts(),
    seedAchievements(),
  ]);
  await seedSavingsGroups();

  console.log("✅ Seed ใหม่เสร็จแล้ว (ทุกระบบ)");
}
