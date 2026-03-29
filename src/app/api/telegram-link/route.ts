import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

// Model สำหรับเก็บ link code ชั่วคราว
const LinkCodeSchema = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 นาที
}, { timestamps: true });

LinkCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LinkCode = mongoose.models.LinkCode || mongoose.model("LinkCode", LinkCodeSchema);

/**
 * POST /api/telegram-link — สร้าง link code สำหรับเชื่อม Telegram
 * Return: { code, link } → ใช้เปิดใน Telegram
 */
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();

  // ลบ code เก่าของ user นี้
  await LinkCode.deleteMany({ userId });

  // สร้าง code ใหม่
  const code = crypto.randomBytes(6).toString("hex"); // 12 chars
  await LinkCode.create({ code, userId });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "jeadtest001bot";
  const link = `https://t.me/${botUsername}?start=LINK_${code}`;

  return NextResponse.json({ code, link, expiresIn: "10 นาที" });
}

// Export model สำหรับใช้ใน telegram route
export { LinkCode };
