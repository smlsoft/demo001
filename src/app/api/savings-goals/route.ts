import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { SavingsGoal } from "@/lib/models/SavingsGoal";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { name, targetAmount, currentAmount, deadline, icon } = body;

  if (!name || !targetAmount) {
    return NextResponse.json({ error: "กรุณากรอกชื่อเป้าหมายและจำนวนเงิน" }, { status: 400 });
  }

  await connectDb();
  const goal = await SavingsGoal.create({
    userId, name, targetAmount, currentAmount: currentAmount || 0, deadline: deadline || "", icon: icon || "🎯",
  });

  return NextResponse.json({ success: true, id: goal._id });
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { id, addAmount, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  if (addAmount) {
    await SavingsGoal.updateOne({ _id: id, userId }, { $inc: { currentAmount: addAmount } });
  } else {
    await SavingsGoal.updateOne({ _id: id, userId }, { $set: updates });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await SavingsGoal.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
