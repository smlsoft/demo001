import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Reminder } from "@/lib/models/Reminder";
import { getSessionUserId } from "@/lib/session";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const reminders = await Reminder.find({ userId }).sort({ dueDay: 1 }).lean();

  // เช็ควันนี้ใกล้ถึงกำหนดหรือเปล่า
  const today = new Date().getDate();
  const result = reminders.map((r: any) => ({
    ...r,
    isDueSoon: Math.abs(r.dueDay - today) <= 3 || (r.dueDay <= 3 && today >= 28),
    isDueToday: r.dueDay === today,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { title, amount, dueDay, category, type } = body;

  if (!title || !dueDay) {
    return NextResponse.json({ error: "กรุณากรอกชื่อรายการและวันที่" }, { status: 400 });
  }

  await connectDb();
  const reminder = await Reminder.create({
    userId, title, amount: amount || 0, dueDay, category: category || "อื่นๆ", type: type || "expense",
  });

  return NextResponse.json({ success: true, id: reminder._id });
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await parseJsonBody(req);
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await Reminder.updateOne({ _id: id, userId }, { $set: updates });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  await connectDb();
  await Reminder.deleteOne({ _id: id, userId });
  return NextResponse.json({ success: true });
}
