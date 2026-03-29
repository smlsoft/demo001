/**
 * HiClaw AI Gateway Client
 * เป็นแกนหลัก AI ของระบบ - เชื่อมต่อ HiClaw (Higress AI Gateway)
 * HiClaw จัดการ: AI model, multi-agent, security, credential management
 *
 * ถ้า HiClaw ไม่พร้อม → แจ้ง error (ไม่มี fallback)
 */

// HiClaw AI Gateway (OpenAI-compatible)
const HICLAW_URL = process.env.HICLAW_GATEWAY_URL || "";
const HICLAW_KEY = process.env.HICLAW_GATEWAY_KEY || "";
const HICLAW_HOST = process.env.HICLAW_GATEWAY_HOST || "aigw-local.hiclaw.io";

// Fallback: OpenRouter (ใช้เมื่อ HiClaw ไม่ได้ตั้ง)
const AI_API_URL = process.env.AI_API_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "google/gemini-2.5-flash";

export interface AiResponse {
  reply: string;
  source: "openclaw" | "openrouter" | "local";
}

/**
 * ส่งข้อความไป HiClaw AI Gateway (OpenAI-compatible)
 */
async function callHiClaw(
  message: string,
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string | null> {
  if (!HICLAW_URL || !HICLAW_KEY) return null;

  try {
    const res = await fetch(`${HICLAW_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HICLAW_KEY}`,
        Host: HICLAW_HOST,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory.slice(-30),
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
      console.error("[HiClaw] error:", res.status, errText.substring(0, 200));
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("[HiClaw] fetch error:", err);
    return null;
  }
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
 * 1. HiClaw AI Gateway (แกนหลัก)
 * 2. OpenRouter (fallback ถ้า HiClaw ไม่ได้ตั้ง)
 * 3. แจ้ง error ถ้าไม่มี AI พร้อม
 */
export async function askAI(
  message: string,
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<AiResponse | null> {
  // 1. HiClaw AI Gateway (แกนหลัก)
  if (HICLAW_URL && HICLAW_KEY) {
    const hiclawReply = await callHiClaw(message, systemPrompt, chatHistory);
    if (hiclawReply) return { reply: hiclawReply, source: "openclaw" };
    // HiClaw ตั้งแล้วแต่ fail → แจ้ง error ไม่ fallback
    console.error("[AI] HiClaw ไม่พร้อม — ไม่มี fallback");
    return { reply: "⚠️ ระบบ AI (HiClaw) ไม่พร้อมชั่วคราว กรุณาลองใหม่อีกครั้ง", source: "local" };
  }

  // 2. OpenRouter (ใช้เมื่อ HiClaw ไม่ได้ตั้ง)
  const routerReply = await callOpenRouter(message, systemPrompt, chatHistory);
  if (routerReply) return { reply: routerReply, source: "openrouter" };

  // 3. ไม่มี AI พร้อม
  return null;
}
