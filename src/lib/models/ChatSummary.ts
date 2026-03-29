import mongoose, { Schema, Document } from "mongoose";

/**
 * สรุปบทสนทนาเก่า (compact history)
 * เมื่อ chat messages เกิน threshold จะสรุปรวมเป็น 1 record
 * ช่วยประหยัด token AI โดยไม่สูญเสียบริบท
 */
export interface IChatSummary extends Document {
  userId: string;
  summary: string;        // สรุปบทสนทนาทั้งหมด
  messageCount: number;   // จำนวนข้อความที่สรุป
  lastCompactedAt: Date;  // สรุปล่าสุดเมื่อไหร่
  createdAt: Date;
}

const ChatSummarySchema = new Schema<IChatSummary>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    summary: { type: String, default: "" },
    messageCount: { type: Number, default: 0 },
    lastCompactedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ChatSummary =
  mongoose.models.ChatSummary ||
  mongoose.model<IChatSummary>("ChatSummary", ChatSummarySchema);
