import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Budget } from "@/lib/models/Budget";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";
import { toBuddhistYear } from "@/lib/demo-users";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const now = new Date();
  const currentMonth = toBuddhistYear(now).substring(0, 7); // 2569-03

  const budgets = await Budget.find({ userId, month: currentMonth }).lean();

  // คำนวณยอดใช้จ่ายจริงแต่ละหมวด
  const monthStart = `${currentMonth}-01`;
  const monthEnd = `${currentMonth}-31`;

  const spending = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);

  const spendingMap: Record<string, number> = {};
  for (const s of spending) spendingMap[s._id] = s.total;

  const result = budgets.map((b: any) => ({
    ...b,
    spent: spendingMap[b.category] || 0,
    remaining: b.monthlyLimit - (spendingMap[b.category] || 0),
    percent: Math.round(((spendingMap[b.category] || 0) / b.monthlyLimit) * 100),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { category, monthlyLimit } = body;

  if (!category || !monthlyLimit) {
    return NextResponse.json({ error: "กรุณากรอกหมวดและงบประมาณ" }, { status: 400 });
  }

  await connectDb();
  const currentMonth = toBuddhistYear(new Date()).substring(0, 7);

  // upsert - ถ้ามีอยู่แล้วให้อัพเดท
  await Budget.updateOne(
    { userId, category, month: currentMonth },
    { $set: { monthlyLimit } },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await Budget.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
