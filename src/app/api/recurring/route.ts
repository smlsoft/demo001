import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { RecurringTx } from "@/lib/models/RecurringTx";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";
import { toBuddhistYear } from "@/lib/demo-users";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const items = await RecurringTx.find({ userId }).sort({ dueDay: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { description, amount, type, category, dueDay } = body;

  if (!description || !amount || !type || !category || !dueDay) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  await connectDb();
  const item = await RecurringTx.create({ userId, description, amount, type, category, dueDay });
  return NextResponse.json({ success: true, id: item._id });
}

// POST /api/recurring?action=execute - สร้างรายการจาก recurring ทั้งหมดที่ถึงกำหนด
export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const currentMonth = toBuddhistYear(new Date()).substring(0, 7);
  const today = toBuddhistYear(new Date());

  const items = await RecurringTx.find({ userId, active: true, lastCreated: { $ne: currentMonth } }).lean();
  const now = new Date().getDate();

  // กรอง items ที่ถึงกำหนดแล้ว
  const dueItems = (items as any[]).filter((item) => item.dueDay <= now);

  if (dueItems.length === 0) return NextResponse.json({ success: true, created: 0 });

  // batch insert ทั้งหมดในครั้งเดียว แทน N queries
  const txDocs = dueItems.map((item) => ({
    userId, date: today, description: `[ซ้ำ] ${item.description}`, amount: item.amount,
    type: item.type, category: item.category, note: "สร้างอัตโนมัติจากรายการซ้ำ",
  }));
  await Transaction.insertMany(txDocs);

  // batch update lastCreated
  const dueIds = dueItems.map((item) => item._id);
  await RecurringTx.updateMany({ _id: { $in: dueIds } }, { $set: { lastCreated: currentMonth } });

  return NextResponse.json({ success: true, created: dueItems.length });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await RecurringTx.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
