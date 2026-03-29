/**
 * OpenClaw Gateway Client
 * เป็นแกนหลัก AI ของระบบ - เชื่อมต่อ OpenClaw ที่รันใน Docker
 * OpenClaw จัดการ: AI model, memory, context, tools
 *
 * ถ้า OpenClaw ไม่พร้อม → fallback ไป OpenRouter API
 */

const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

// OpenRouter fallback
const AI_API_URL = process.env.AI_API_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

export interface AiResponse {
  reply: string;
  source: "openclaw" | "openrouter" | "local";
}

/**
 * ส่งข้อความไป OpenClaw Gateway (WebSocket → HTTP bridge)
 * OpenClaw ใช้ WebSocket แต่เราจะสร้าง HTTP bridge ผ่าน API route
 */
async function callOpenClaw(
  message: string,
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string | null> {
  if (!OPENCLAW_URL || !OPENCLAW_TOKEN) return null;

  try {
    // ลอง REST API ของ OpenClaw (ถ้ามี)
    const res = await fetch(`${OPENCLAW_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        system: systemPrompt,
        history: chatHistory.slice(-10),
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      return data.reply || data.content || data.message || null;
    }
  } catch {
    // OpenClaw ไม่พร้อม - fallback
  }

  return null;
}

/**
 * ส่งข้อความไป OpenRouter API (fallback)
 */
async function callOpenRouter(
  message: string,
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string | null> {
  if (!AI_API_URL || !AI_API_KEY) return null;

  try {
    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory.slice(-30),
          // message อยู่ใน chatHistory ท้ายสุดแล้ว (บันทึกใน handleChat ก่อนเรียก processMessage)
          // ถ้า chatHistory ว่างหรือตัวสุดท้ายไม่ใช่ message นี้ ถึงเพิ่ม
          ...(chatHistory.length === 0 || chatHistory[chatHistory.length - 1]?.content !== message
            ? [{ role: "user" as const, content: message }]
            : []),
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[OpenRouter] error:", res.status, errText.substring(0, 200));
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[OpenRouter] empty response:", JSON.stringify(data).substring(0, 200));
    }
    return content || null;
  } catch (err) {
    console.error("[OpenRouter] fetch error:", err);
    return null;
  }
}

/**
 * Main AI function - ลองเรียง:
 * 1. OpenClaw (แกนหลัก)
 * 2. OpenRouter (fallback)
 * 3. null (ใช้ local built-in)
 */
export async function askAI(
  message: string,
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<AiResponse | null> {
  // 1. OpenClaw
  const clawReply = await callOpenClaw(message, systemPrompt, chatHistory);
  if (clawReply) return { reply: clawReply, source: "openclaw" };

  // 2. OpenRouter
  const routerReply = await callOpenRouter(message, systemPrompt, chatHistory);
  if (routerReply) return { reply: routerReply, source: "openrouter" };

  // 3. ไม่มี AI พร้อม
  return null;
}
