import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/session";
import { DEMO_USERS } from "@/lib/demo-users";
import { connectDb } from "@/lib/db";
import { seedDemoData } from "@/lib/seed";
import { parseJsonBody } from "@/lib/parse-body";

export async function POST(req: NextRequest) {
  const { userId } = await parseJsonBody(req);
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });
  }

  // เชื่อมต่อ DB และ seed ข้อมูลถ้ายังไม่มี
  await connectDb();
  await seedDemoData();

  const res = NextResponse.json({ success: true, user });
  res.cookies.set(getSessionCookieName(), userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ปี - เก็บถาวร
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(getSessionCookieName());
  return res;
}
