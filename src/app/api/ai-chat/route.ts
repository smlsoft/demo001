import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { ChatMessage } from "@/lib/models/ChatMessage";
import { getSessionUserId } from "@/lib/session";
import { handleChat } from "@/lib/ai-engine";

// GET - ดึงประวัติ chat (เก็บถาวร)
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  await connectDb();
  const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 }).limit(100).lean();
  return NextResponse.json(messages);
}

// POST - ส่งข้อความ
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "กรุณาพิมพ์ข้อความ" }, { status: 400 });

  const result = await handleChat(message, userId);
  return NextResponse.json(result);
}
