/**
 * Chat History Compaction
 * เมื่อข้อความเกิน COMPACT_THRESHOLD → สรุปข้อความเก่าเป็น 1 บทสรุป
 * ส่งไป AI แค่: [สรุปเก่า] + [10 ข้อความล่าสุด]
 * ประหยัด token ได้ 70-80%
 */

import { ChatMessage } from "./models/ChatMessage";
import { ChatSummary } from "./models/ChatSummary";
import { connectDb } from "./db";

const AI_API_URL = process.env.AI_API_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

// สรุปเมื่อ chat เกิน 30 ข้อความ
const COMPACT_THRESHOLD = 30;
// เก็บข้อความล่าสุดไว้ 10 ข้อความ (ไม่ลบ)
const KEEP_RECENT = 10;

/**
 * ดึง chat history สำหรับส่ง AI (compact แล้ว)
 * Return: [summary message (ถ้ามี)] + [recent messages]
 */
export async function getCompactHistory(
  userId: string
): Promise<Array<{ role: string; content: string }>> {
  await connectDb();

  // ตรวจว่าควร compact ไหม
  const totalCount = await ChatMessage.countDocuments({ userId });
  if (totalCount > COMPACT_THRESHOLD) {
    await compactHistory(userId);
  }

  // ดึง summary เก่า (ถ้ามี)
  const existingSummary = await ChatSummary.findOne({ userId }).lean();

  // ดึงข้อความล่าสุด
  const recentMessages = await ChatMessage.find({ userId })
    .sort({ createdAt: -1 })
    .limit(KEEP_RECENT)
    .lean();

  const messages: Array<{ role: string; content: string }> = [];

  // ใส่สรุปเก่าเป็น context
  if (existingSummary && (existingSummary as any).summary) {
    messages.push({
      role: "user",
      content: `[สรุปบทสนทนาก่อนหน้า: ${(existingSummary as any).summary}]`,
    });
    messages.push({
      role: "assistant",
      content: "เข้าใจค่ะ จำได้ทั้งหมด มีอะไรให้ช่วยต่อไหมคะ",
    });
  }

  // ใส่ข้อความล่าสุด (เรียงจากเก่าไปใหม่)
  const sorted = recentMessages.reverse();
  for (const m of sorted) {
    messages.push({ role: (m as any).role, content: (m as any).content });
  }

  return messages;
}

/**
 * สรุปข้อความเก่า แล้วลบออก เหลือเฉพาะล่าสุด
 */
async function compactHistory(userId: string): Promise<void> {
  const totalCount = await ChatMessage.countDocuments({ userId });
  if (totalCount <= COMPACT_THRESHOLD) return;

  // ดึงข้อความเก่าที่จะสรุป (จำกัด 200 ข้อความ เพื่อไม่ให้ memory ล้น)
  const maxCompact = Math.min(totalCount - KEEP_RECENT, 200);
  const oldMessages = await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .limit(maxCompact)
    .lean();

  if (oldMessages.length === 0) return;

  // สรุปเก่าที่มีอยู่
  const existing = await ChatSummary.findOne({ userId }).lean();
  const oldSummary = existing ? (existing as any).summary : "";

  // สร้างข้อความที่จะสรุป
  const chatText = oldMessages
    .map((m: any) => `${m.role === "user" ? "ผู้ใช้" : "น้องบัญชี"}: ${m.content}`)
    .join("\n")
    .substring(0, 3000); // จำกัดขนาด

  // ส่งไป AI สรุป
  const newSummary = await summarizeWithAI(oldSummary, chatText);

  if (newSummary) {
    // บันทึกสรุปใหม่
    await ChatSummary.findOneAndUpdate(
      { userId },
      {
        userId,
        summary: newSummary,
        messageCount: (existing ? (existing as any).messageCount : 0) + oldMessages.length,
        lastCompactedAt: new Date(),
      },
      { upsert: true }
    );

    // ลบข้อความเก่าที่สรุปแล้ว
    const oldIds = oldMessages.map((m: any) => m._id);
    await ChatMessage.deleteMany({ _id: { $in: oldIds } });

    console.log(`[compact] userId=${userId} summarized ${oldMessages.length} messages`);
  }
}

/**
 * ใช้ AI สรุปบทสนทนา
 */
async function summarizeWithAI(
  previousSummary: string,
  newMessages: string
): Promise<string | null> {
  if (!AI_API_URL || !AI_API_KEY) {
    // ถ้าไม่มี AI ใช้วิธีตัดสั้น
    return (previousSummary + "\n" + newMessages).substring(0, 1000);
  }

  try {
    const prompt = previousSummary
      ? `สรุปเก่า:\n${previousSummary}\n\nข้อความใหม่:\n${newMessages}`
      : `ข้อความ:\n${newMessages}`;

    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `สรุปบทสนทนาให้สั้นกระชับเป็นภาษาไทย เน้น:
- ข้อมูลส่วนตัวของผู้ใช้ (ชื่อ อาชีพ สิ่งที่ชอบ)
- เรื่องสำคัญที่เคยคุยกัน
- สิ่งที่ผู้ใช้ขอให้จำ
- รายการเงินสำคัญ
สรุปไม่เกิน 500 ตัวอักษร ไม่ต้องมีหัวข้อ`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
