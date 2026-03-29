import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";

/**
 * POST /api/auth/google — รับ Google ID Token แล้ว verify + สร้าง session
 */
export async function POST(req: NextRequest) {
  const { credential } = await req.json();
  if (!credential) {
    return NextResponse.json({ error: "ไม่พบ credential" }, { status: 400 });
  }

  // Decode JWT payload (Google ID Token เป็น JWT 3 ส่วน)
  try {
    const parts = credential.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    const { email, name, picture, sub: googleId } = payload;
    if (!email) throw new Error("No email in token");

    // Verify iss + aud (basic check)
    const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
    if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
      throw new Error("Invalid issuer");
    }
    if (googleClientId && payload.aud !== googleClientId) {
      throw new Error("Invalid audience");
    }
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error("Token expired");
    }

    await connectDb();

    // สร้าง/อัพเดท user จาก email
    const userId = `google-${email}`;
    const displayName = name || email.split("@")[0];

    await User.findOneAndUpdate(
      { demoId: userId },
      {
        demoId: userId,
        name: displayName,
        occupation: "ผู้ใช้ Google",
        avatar: "👤",
        email,
        picture,
        googleId,
      },
      { upsert: true, new: true }
    );

    const res = NextResponse.json({
      success: true,
      user: { id: userId, name: displayName, email, picture },
    });
    res.cookies.set(getSessionCookieName(), userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (err: any) {
    console.error("Google auth error:", err.message);
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ: " + err.message }, { status: 401 });
  }
}
