/**
 * Vision AI - วิเคราะห์รูปภาพ
 * ใช้ Gemini Flash (รองรับ image input) ผ่าน OpenRouter
 * ถ้าเป็น slip/การเงิน → ดึงข้อมูลเงิน + ถามยืนยัน
 */

const AI_API_URL = process.env.AI_API_URL || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_VISION_MODEL || process.env.AI_MODEL || "google/gemini-2.5-flash";

export interface VisionResult {
  isFinancial: boolean;
  type?: "income" | "expense" | "unknown";
  amount?: number;
  description?: string;
  from?: string;    // ชื่อผู้โอน/ร้านค้า
  to?: string;      // ชื่อผู้รับ
  date?: string;    // วันที่ในเอกสาร
  summary: string;  // สรุปสิ่งที่เห็นในรูป
  raw?: any;
}

/**
 * วิเคราะห์รูปภาพด้วย AI Vision
 * @param imageBase64 รูปภาพเป็น base64
 * @param mimeType เช่น image/jpeg, image/png
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string
): Promise<VisionResult> {
  if (!AI_API_URL || !AI_API_KEY) {
    return { isFinancial: false, summary: "ไม่สามารถวิเคราะห์รูปได้ (ยังไม่ได้ตั้งค่า AI)" };
  }

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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `วิเคราะห์รูปภาพนี้ ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown):
{
  "isFinancial": true/false (เป็นเอกสารการเงินหรือไม่ เช่น slip โอนเงิน, ใบเสร็จ, บิล, สลิปถอนเงิน, รายงานการเงิน),
  "type": "income" หรือ "expense" หรือ "unknown" (ถ้าเป็นเอกสารการเงิน: slip รับโอน/ถอนเงินเข้า = income, slip จ่ายเงิน/ซื้อของ/ใบเสร็จ = expense, ไม่แน่ใจ = unknown),
  "amount": ตัวเลขจำนวนเงิน (ถ้ามี, ไม่มีใส่ 0),
  "description": "อธิบายสั้นๆ เป็นภาษาไทยว่าเอกสารนี้คืออะไร",
  "from": "ชื่อผู้โอน/ร้านค้า (ถ้ามี)",
  "to": "ชื่อผู้รับ (ถ้ามี)",
  "date": "วันที่ในเอกสาร (ถ้ามี)",
  "summary": "สรุปสิ่งที่เห็นในรูปเป็นภาษาไทย 1-2 ประโยค"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Vision API error:", res.status, errText);
      return { isFinancial: false, summary: "ไม่สามารถวิเคราะห์รูปได้" };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON จาก AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isFinancial: !!parsed.isFinancial,
          type: parsed.type || "unknown",
          amount: parsed.amount || 0,
          description: parsed.description || "",
          from: parsed.from || "",
          to: parsed.to || "",
          date: parsed.date || "",
          summary: parsed.summary || content,
          raw: parsed,
        };
      } catch {}
    }

    return { isFinancial: false, summary: content.substring(0, 200) };
  } catch (err) {
    console.error("Vision error:", err);
    return { isFinancial: false, summary: "เกิดข้อผิดพลาดในการวิเคราะห์รูป" };
  }
}

/**
 * สร้างข้อความตอบกลับจากผลวิเคราะห์
 */
export function buildVisionReply(result: VisionResult): string {
  if (!result.isFinancial) {
    return `🖼️ ${result.summary}`;
  }

  let reply = `🧾 พบเอกสารการเงิน!\n\n`;
  reply += `📄 ${result.description}\n`;

  if (result.amount && result.amount > 0) {
    reply += `💰 จำนวน: ${result.amount.toLocaleString()} บาท\n`;
  }
  if (result.from) reply += `👤 จาก: ${result.from}\n`;
  if (result.to) reply += `👤 ถึง: ${result.to}\n`;
  if (result.date) reply += `📅 วันที่: ${result.date}\n`;

  if (result.amount && result.amount > 0) {
    if (result.type === "income") {
      reply += `\n📥 ดูเหมือนเป็น *รายรับ* ${result.amount.toLocaleString()} บาท\n`;
      reply += `ตอบ "ใช่" เพื่อบันทึกเป็นรายรับ\n`;
      reply += `ตอบ "รายจ่าย" ถ้าเป็นรายจ่าย`;
    } else if (result.type === "expense") {
      reply += `\n📤 ดูเหมือนเป็น *รายจ่าย* ${result.amount.toLocaleString()} บาท\n`;
      reply += `ตอบ "ใช่" เพื่อบันทึกเป็นรายจ่าย\n`;
      reply += `ตอบ "รายรับ" ถ้าเป็นรายรับ`;
    } else {
      reply += `\n❓ ไม่แน่ใจว่าเป็นรายรับหรือรายจ่าย\n`;
      reply += `ตอบ "รายรับ" หรือ "รายจ่าย" เพื่อบันทึก`;
    }
  }

  return reply;
}
