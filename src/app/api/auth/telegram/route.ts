import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, getSessionUserId } from "@/lib/session";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { registerTelegramUser } from "@/lib/telegram-users";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * POST /api/auth/telegram — รับข้อมูลจาก Telegram Login Widget
 * ผูก Telegram account กับ user ที่ login อยู่ หรือสร้าง session ใหม่
 */
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { id, first_name, last_name, username, photo_url, auth_date, hash } = data;

  if (!id || !hash) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  // Verify hash จาก Telegram
  if (BOT_TOKEN) {
    const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
    const checkFields = Object.keys(data)
      .filter((k) => k !== "hash")
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join("\n");
    const hmac = crypto.createHmac("sha256", secretKey).update(checkFields).digest("hex");

    if (hmac !== hash) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 401 });
    }

    // ตรวจ auth_date ไม่เกิน 1 วัน
    if (auth_date && Date.now() / 1000 - auth_date > 86400) {
      return NextResponse.json({ error: "ข้อมูลหมดอายุ" }, { status: 401 });
    }
  }

  await connectDb();

  const telegramId = Number(id);
  const displayName = [first_name, last_name].filter(Boolean).join(" ") || `User ${id}`;

  // ดูว่า login อยู่ไหม
  const currentUserId = await getSessionUserId();

  if (currentUserId) {
    // ผูก Telegram กับบัญชีปัจจุบัน
    await registerTelegramUser(telegramId, displayName, currentUserId);

    return NextResponse.json({
      success: true,
      mode: "linked",
      message: `เชื่อมต่อ Telegram กับบัญชี ${currentUserId} สำเร็จ`,
      user: { telegramId, name: displayName, linkedTo: currentUserId },
    });
  }

  // ไม่ได้ login — สร้าง user ใหม่จาก Telegram แล้ว login
  const userId = `telegram-${telegramId}`;
  await User.findOneAndUpdate(
    { demoId: userId },
    {
      demoId: userId,
      name: displayName,
      occupation: "ผู้ใช้ Telegram",
      avatar: "👤",
      picture: photo_url || "",
    },
    { upsert: true }
  );
  await registerTelegramUser(telegramId, displayName, userId);

  const res = NextResponse.json({
    success: true,
    mode: "login",
    message: `เข้าสู่ระบบด้วย Telegram สำเร็จ`,
    user: { id: userId, name: displayName },
  });
  res.cookies.set(getSessionCookieName(), userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
