import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { handlePhoto } from "@/lib/ai-engine";

/**
 * อัพโหลดรูปจากเว็บ → AI วิเคราะห์ + เก็บ R2
 * ทำงานเหมือน Telegram photo handler
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "กรุณาเลือกรูป" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const result = await handlePhoto(base64, file.type, userId, "web");
  return NextResponse.json(result);
}
