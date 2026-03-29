import { connectDb } from "./db";
import { User } from "./models/User";
import { Transaction } from "./models/Transaction";

const DEMO_USERS_DATA = [
  { demoId: "demo-1", name: "สมชาย", occupation: "ชาวนา", avatar: "🌾" },
  { demoId: "demo-2", name: "สมหญิง", occupation: "ค้าขาย", avatar: "🏪" },
  { demoId: "demo-3", name: "สมศักดิ์", occupation: "รับจ้างทั่วไป", avatar: "🔧" },
  { demoId: "demo-4", name: "สมใจ", occupation: "ทำสวน", avatar: "🌿" },
  { demoId: "demo-5", name: "สมปอง", occupation: "เลี้ยงสัตว์", avatar: "🐄" },
];

const SAMPLE_TRANSACTIONS: Record<string, Array<{ date: string; description: string; amount: number; type: "income" | "expense"; category: string }>> = {
  "demo-1": [
    { date: "2569-03-01", description: "ขายข้าว 5 กระสอบ", amount: 7500, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-05", description: "ซื้อปุ๋ย", amount: 1200, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-10", description: "เงินสงเคราะห์ผู้สูงอายุ", amount: 600, type: "income", category: "สวัสดิการ" },
    { date: "2569-03-12", description: "ค่าอาหารในบ้าน", amount: 850, type: "expense", category: "อาหาร/ของใช้" },
    { date: "2569-03-15", description: "ขายข้าว 3 กระสอบ", amount: 4500, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-18", description: "ค่าน้ำมันรถไถ", amount: 500, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-20", description: "ค่าไฟฟ้า", amount: 350, type: "expense", category: "อาหาร/ของใช้" },
    { date: "2569-03-25", description: "ทำบุญวัด", amount: 200, type: "expense", category: "งานสังคม" },
  ],
  "demo-2": [
    { date: "2569-03-01", description: "ขายของหน้าร้าน", amount: 3200, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-03", description: "ซื้อสินค้ามาขาย", amount: 1800, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-07", description: "ขายของหน้าร้าน", amount: 2800, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-10", description: "ค่าเช่าร้าน", amount: 2000, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-14", description: "ขายของหน้าร้าน", amount: 4100, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-20", description: "ค่าอาหาร", amount: 1200, type: "expense", category: "อาหาร/ของใช้" },
  ],
  "demo-3": [
    { date: "2569-03-02", description: "รับจ้างก่อสร้าง", amount: 4500, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-08", description: "รับจ้างซ่อมบ้าน", amount: 2000, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-10", description: "ค่าอาหาร", amount: 900, type: "expense", category: "อาหาร/ของใช้" },
    { date: "2569-03-15", description: "รับจ้างทาสี", amount: 3000, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-20", description: "ค่าเครื่องมือช่าง", amount: 800, type: "expense", category: "ค่าประกอบอาชีพ" },
  ],
  "demo-4": [
    { date: "2569-03-01", description: "ขายผักสวนครัว", amount: 1500, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-05", description: "ซื้อเมล็ดพันธุ์", amount: 300, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-10", description: "ขายผลไม้", amount: 2500, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-15", description: "ค่าน้ำประปา", amount: 150, type: "expense", category: "อาหาร/ของใช้" },
    { date: "2569-03-20", description: "ขายสมุนไพร", amount: 800, type: "income", category: "รายได้อาชีพหลัก" },
  ],
  "demo-5": [
    { date: "2569-03-01", description: "ขายไข่ไก่", amount: 900, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-05", description: "ซื้ออาหารสัตว์", amount: 1500, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-10", description: "ขายลูกวัว", amount: 15000, type: "income", category: "รายได้อาชีพหลัก" },
    { date: "2569-03-15", description: "ค่ายารักษาสัตว์", amount: 500, type: "expense", category: "ค่าประกอบอาชีพ" },
    { date: "2569-03-20", description: "ขายน้ำนม", amount: 1200, type: "income", category: "รายได้อาชีพหลัก" },
  ],
};

export async function seedDemoData() {
  await connectDb();

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  // สร้าง users
  await User.insertMany(DEMO_USERS_DATA);

  // สร้าง transactions
  for (const [userId, txs] of Object.entries(SAMPLE_TRANSACTIONS)) {
    const docs = txs.map((tx) => ({ userId, ...tx }));
    await Transaction.insertMany(docs);
  }

  console.log("✅ Seeded demo data");
}
