import { connectDb } from "./db";
import mongoose, { Schema, Document } from "mongoose";

/**
 * Mapping ระหว่าง Telegram user ID กับ ThaiClaw user ID
 * ชาวบ้านลงทะเบียนผ่าน Telegram แล้วผูกกับ Demo account
 */

export interface ITelegramUser extends Document {
  telegramId: number;
  telegramName: string;
  userId: string; // ThaiClaw user ID (demo-1 ถึง demo-5 หรือ custom)
  createdAt: Date;
}

const TelegramUserSchema = new Schema<ITelegramUser>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    telegramName: { type: String, default: "" },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export const TelegramUser =
  mongoose.models.TelegramUser ||
  mongoose.model<ITelegramUser>("TelegramUser", TelegramUserSchema);

/**
 * หา ThaiClaw userId จาก Telegram ID
 * ถ้ายังไม่ลงทะเบียน return null
 */
export async function getTelegramUserId(telegramId: number): Promise<string | null> {
  await connectDb();
  const mapping = await TelegramUser.findOne({ telegramId }).lean();
  return mapping ? (mapping as any).userId : null;
}

/**
 * ลงทะเบียน Telegram user กับ Demo account
 */
export async function registerTelegramUser(
  telegramId: number,
  telegramName: string,
  userId: string
): Promise<void> {
  await connectDb();
  await TelegramUser.findOneAndUpdate(
    { telegramId },
    { telegramId, telegramName, userId },
    { upsert: true }
  );
}
