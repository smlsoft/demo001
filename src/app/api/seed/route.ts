import { NextResponse } from "next/server";
import { resetAndSeed } from "@/lib/seed";

/**
 * POST /api/seed — ลบข้อมูลทั้งหมดแล้ว seed ใหม่ครบทุกระบบ
 */
export async function POST() {
  try {
    await resetAndSeed();
    return NextResponse.json({ success: true, message: "Seed ใหม่เสร็จแล้ว ครบทุกระบบ" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
