import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { FileDoc } from "@/lib/models/FileDoc";
import { getSessionUserId } from "@/lib/session";
import { getR2SignedUrl } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { id } = await params;
  await connectDb();
  const file = await FileDoc.findOne({ _id: id, userId });

  if (!file) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }

  // สร้าง signed URL จาก R2 แล้ว redirect ไป
  const signedUrl = await getR2SignedUrl(file.r2Key);
  return NextResponse.redirect(signedUrl);
}
