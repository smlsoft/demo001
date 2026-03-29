import { NextRequest, NextResponse } from "next/server";
import { handleChat, handlePhoto } from "@/lib/ai-engine";
import { getTelegramUserId, registerTelegramUser } from "@/lib/telegram-users";
import { connectDb } from "@/lib/db";
import { seedDemoData } from "@/lib/seed";
import { DEMO_USERS } from "@/lib/demo-users";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// Telegram webhook timeout = 60 วินาที เราต้องตอบก่อน
const MAX_PROCESS_TIME = 25000; // 25 วินาที

/**
 * Telegram Webhook
 * กฎสำคัญ: ต้อง return 200 เร็วที่สุด ไม่ให้ Telegram retry
 * ถ้าประมวลผลนาน → ส่ง "กำลังคิด..." ก่อน แล้วค่อยตอบจริง
 */
export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true });

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // ประมวลผลใน background ไม่ block response
  processUpdate(update).catch((err) => {
    console.error("[Telegram] unhandled error:", err?.message || err);
  });

  // ตอบ Telegram ทันที
  return NextResponse.json({ ok: true });
}

// ===== ประมวลผล Update (background) =====

async function processUpdate(update: any) {
  try {
    await connectDb();
  } catch (err: any) {
    console.error("[Telegram] DB connect failed:", err?.message);
    // ลอง seed ถ้า connect ได้
    return;
  }

  try {
    await seedDemoData();
  } catch {}

  // --- Callback query (กดปุ่ม) ---
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  // --- Message ---
  const message = update.message;
  if (!message) return;

  const telegramId = message.from.id;
  const telegramName = message.from.first_name || "";
  const chatId = message.chat.id;

  // --- รูปภาพ ---
  if (message.photo && message.photo.length > 0) {
    await handlePhotoMessage(message, telegramId, chatId);
    return;
  }

  // --- ข้อความ text ---
  if (!message.text) return;
  const text = message.text.trim();

  // /start — เชื่อมบัญชีจากเว็บ หรือ สร้างบัญชีส่วนตัว
  if (text.startsWith("/start")) {
    const param = text.replace("/start", "").trim();

    // === กรณี LINK_xxx: เชื่อมจากเว็บ (กด link ในหน้า Telegram setup) ===
    if (param.startsWith("LINK_")) {
      const code = param.replace("LINK_", "");
      try {
        const mongoose = await import("mongoose");
        const LinkCodeSchema = new mongoose.Schema({
          code: String, userId: String, expiresAt: Date,
        });
        const LinkCode = mongoose.models.LinkCode || mongoose.model("LinkCode", LinkCodeSchema);

        const linkDoc = await LinkCode.findOne({ code }) as any;
        if (linkDoc && linkDoc.expiresAt > new Date()) {
          // ผูก Telegram ID กับ userId จากเว็บ
          await registerTelegramUser(telegramId, telegramName, linkDoc.userId);
          await LinkCode.deleteOne({ _id: linkDoc._id });

          // หาชื่อ user
          const { User } = await import("@/lib/models/User");
          const user = await User.findOne({ demoId: linkDoc.userId }).lean() as any;
          const demoUser = DEMO_USERS.find((u) => u.id === linkDoc.userId);
          const displayName = user?.name || demoUser?.name || linkDoc.userId;

          await sendTelegram(chatId,
            `✅ เชื่อมต่อสำเร็จ!\n\n` +
            `🔗 บัญชี Telegram ของ *${telegramName}*\n` +
            `ผูกกับ *${displayName}* เรียบร้อยแล้ว!\n\n` +
            `ข้อมูลเว็บ ↔ Telegram เชื่อมกันแล้ว\n` +
            `ลองพิมพ์ "สรุปยอด" ดูได้เลย!`
          );
          return;
        } else {
          await sendTelegram(chatId, `❌ ลิงก์หมดอายุแล้ว กรุณาสร้างลิงก์ใหม่จากเว็บ`);
          return;
        }
      } catch (err: any) {
        console.error("[Telegram] LINK error:", err.message);
        await sendTelegram(chatId, `❌ เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่`);
        return;
      }
    }

    // === กรณีปกติ: สร้างบัญชีส่วนตัว ===
    const personalId = `telegram-${telegramId}`;
    const { User } = await import("@/lib/models/User");
    await User.findOneAndUpdate(
      { demoId: personalId },
      { demoId: personalId, name: telegramName || `User ${telegramId}`, occupation: "ผู้ใช้ Telegram", avatar: "👤" },
      { upsert: true }
    );
    await registerTelegramUser(telegramId, telegramName, personalId);

    await sendTelegram(chatId,
      `🏡 สวัสดี *${telegramName}*!\n\n` +
      `ยินดีต้อนรับสู่ *บัญชีครัวเรือน*\n` +
      `ระบบสร้างบัญชีส่วนตัวให้คุณแล้ว!\n\n` +
      `ลองพิมพ์:\n` +
      `📥 "ขายข้าว 3000 บาท"\n` +
      `📤 "ซื้อปุ๋ย 500 บาท"\n` +
      `📊 "สรุปยอด"\n` +
      `📷 ส่งรูป slip ได้เลย!\n\n` +
      `💡 ถ้าเชื่อมจากเว็บ → ข้อมูลจะเชื่อมกันอัตโนมัติ`
    );
    return;
  }

  // /demo — เลือกดูข้อมูล demo (ของเดิม)
  if (text === "/demo") {
    const keyboard = DEMO_USERS.map((u) => [
      { text: `${u.avatar} ${u.name} (${u.occupation})`, callback_data: `login:${u.id}` },
    ]);
    await sendTelegram(chatId,
      `📋 เลือกบัญชีตัวอย่างเพื่อดูข้อมูล Demo:\n(พิมพ์ /start เพื่อกลับบัญชีส่วนตัว)`,
      { inline_keyboard: keyboard }
    );
    return;
  }

  // /help
  if (text === "/help") {
    await sendTelegram(chatId,
      `🤖 วิธีใช้ บัญชีครัวเรือน:\n\n` +
      `📥 บันทึกรายรับ: "ขายข้าว 3000 บาท"\n` +
      `📤 บันทึกรายจ่าย: "ซื้อปุ๋ย 500 บาท"\n` +
      `📊 ดูสรุป: "สรุปยอด"\n` +
      `📋 ดูรายการ: "ดูรายการล่าสุด"\n` +
      `💡 คำแนะนำ: "แนะนำวิธีออมเงิน"\n` +
      `📷 ส่งรูป slip/ใบเสร็จ: บันทึกอัตโนมัติ\n` +
      `🔄 เปลี่ยนบัญชี: /start\n\n` +
      `หรือจะคุยเรื่องอะไรก็ได้!`
    );
    return;
  }

  // ตรวจลงทะเบียน
  const userId = await getTelegramUserId(telegramId);
  if (!userId) {
    await sendTelegram(chatId, `สวัสดี ${telegramName}!\nกรุณากด /start เพื่อเลือกบัญชีก่อนนะคะ`);
    return;
  }

  // ส่ง typing indicator
  await sendTyping(chatId);

  // ประมวลผลพร้อม timeout
  try {
    const result = await withTimeout(handleChat(text, userId), MAX_PROCESS_TIME);
    await sendTelegram(chatId, result.reply);
  } catch (err: any) {
    console.error("[Telegram] chat error:", err?.message);
    await sendTelegram(chatId, `ขออภัยค่ะ ระบบขัดข้องชั่วคราว ลองพิมพ์ใหม่อีกครั้งนะคะ`);
  }
}

// ===== Callback Handler =====

async function handleCallback(cb: any) {
  const data = cb.data || "";
  const chatId = cb.message?.chat?.id;
  const telegramId = cb.from.id;
  const name = cb.from.first_name || "";

  if (data.startsWith("login:") && chatId) {
    const demoId = data.replace("login:", "");
    const user = DEMO_USERS.find((u) => u.id === demoId);
    if (user) {
      try {
        await registerTelegramUser(telegramId, name, demoId);
        await sendTelegram(chatId,
          `${user.avatar} เข้าสู่ระบบเป็น *${user.name}* (${user.occupation}) แล้ว!\n\n` +
          `ลองพิมพ์:\n📥 "ขายข้าว 3000 บาท"\n📤 "ซื้อปุ๋ย 500 บาท"\n📊 "สรุปยอด"\n\nหรือจะคุยเรื่องอะไรก็ได้!`
        );
      } catch (err: any) {
        console.error("[Telegram] login error:", err?.message);
        await sendTelegram(chatId, `เกิดข้อผิดพลาด กรุณาลอง /start อีกครั้ง`);
      }
    }
  }

  // ตอบ callback query (ลบ loading indicator)
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cb.id }),
    });
  } catch {}
}

// ===== Photo Handler =====

async function handlePhotoMessage(message: any, telegramId: number, chatId: number) {
  const userId = await getTelegramUserId(telegramId);
  if (!userId) {
    await sendTelegram(chatId, `กรุณากด /start เพื่อเลือกบัญชีก่อนนะคะ`);
    return;
  }

  const photo = message.photo[message.photo.length - 1];
  await sendTelegram(chatId, `🔍 กำลังวิเคราะห์รูปภาพ...`);
  await sendTyping(chatId);

  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result?.file_path;

    if (!filePath) {
      await sendTelegram(chatId, `ไม่สามารถดาวน์โหลดรูปได้ ลองส่งใหม่นะคะ`);
      return;
    }

    const imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = imgBuffer.toString("base64");
    const mimeType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";

    const result = await withTimeout(handlePhoto(base64, mimeType, userId, "telegram"), MAX_PROCESS_TIME);
    await sendTelegram(chatId, result.reply);
  } catch (err: any) {
    console.error("[Telegram] photo error:", err?.message);
    await sendTelegram(chatId, `เกิดข้อผิดพลาดในการวิเคราะห์รูป ลองส่งใหม่นะคะ`);
  }
}

// ===== Helpers =====

async function sendTelegram(chatId: number, text: string, replyMarkup?: any): Promise<void> {
  try {
    const body: any = { chat_id: chatId, text, parse_mode: "Markdown" };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    // ถ้า Markdown parse ล้มเหลว ลองส่งแบบไม่มี parse_mode
    if (!res.ok) {
      delete body.parse_mode;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
    }
  } catch (err: any) {
    console.error("[Telegram] send error:", err?.message);
  }
}

async function sendTyping(chatId: number): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
