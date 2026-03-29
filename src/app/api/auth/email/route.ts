import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";

/**
 * POST /api/auth/email — เข้าสู่ระบบด้วย Email (ไม่ต้องรหัสผ่าน สำหรับ demo)
 * สร้าง user แยกตาม email
 */
export async function POST(req: NextRequest) {
  const { email, name } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "กรุณากรอก Email ที่ถูกต้อง" }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userId = `email-${cleanEmail}`;
  const displayName = name?.trim() || cleanEmail.split("@")[0];

  await connectDb();

  await User.findOneAndUpdate(
    { demoId: userId },
    {
      demoId: userId,
      name: displayName,
      occupation: "ผู้ใช้ Email",
      avatar: "✉️",
      email: cleanEmail,
    },
    { upsert: true }
  );

  const res = NextResponse.json({
    success: true,
    user: { id: userId, name: displayName, email: cleanEmail },
  });
  res.cookies.set(getSessionCookieName(), userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
