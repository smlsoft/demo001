import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100")));
  const skip = (page - 1) * limit;

  await connectDb();
  const [transactions, total] = await Promise.all([
    Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments({ userId }),
  ]);

  return NextResponse.json({
    data: transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { date, description, amount, type, category, note } = body;

  if (!date || !description || !amount || !type || !category) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (amount > 10000000 || amount <= 0) {
    return NextResponse.json({ error: "จำนวนเงินต้องอยู่ระหว่าง 1 - 10,000,000 บาท" }, { status: 400 });
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
