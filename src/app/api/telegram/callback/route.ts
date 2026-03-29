import { NextRequest, NextResponse } from "next/server";
import { registerTelegramUser } from "@/lib/telegram-users";
import { DEMO_USERS } from "@/lib/demo-users";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ไม่ได้ใช้จริง - callback_query มาใน webhook เดียวกัน
 * ดู POST handler ใน ../route.ts
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
