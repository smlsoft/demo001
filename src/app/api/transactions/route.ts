import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { date, description, amount, type, category, note } = body;

  if (!date || !description || !amount || !type || !category) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  await connectDb();
  const tx = await Transaction.create({
    userId,
    date,
    description,
    amount,
    type,
    category,
    note: note || "",
  });

  return NextResponse.json({ success: true, id: tx._id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await Transaction.deleteOne({ _id: id, userId });

  return NextResponse.json({ success: true });
}
