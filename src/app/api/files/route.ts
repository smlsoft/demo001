import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { FileDoc } from "@/lib/models/FileDoc";
import { getSessionUserId } from "@/lib/session";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const files = await FileDoc.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "อื่นๆ";
  const description = (formData.get("description") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "กรุณาเลือกไฟล์" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${uuidv4()}-${file.name}`;

  // อัพโหลดไป R2 - แยกโฟลเดอร์ตามคน
  const r2Key = await uploadToR2(userId, filename, buffer, file.type);

  await connectDb();
  const doc = await FileDoc.create({
    userId,
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    category,
    description,
    r2Key,
  });

  return NextResponse.json({ success: true, id: doc._id, filename });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  await connectDb();
  const file = await FileDoc.findOne({ _id: id, userId });
  if (file) {
    await deleteFromR2(file.r2Key);
    await FileDoc.deleteOne({ _id: id, userId });
  }

  return NextResponse.json({ success: true });
}
