import mongoose, { Schema, Document } from "mongoose";

/**
 * Transaction ที่รอยืนยันจากรูปภาพ
 * เก็บชั่วคราว รอชาวบ้านตอบ "ใช่" / "รายรับ" / "รายจ่าย"
 */
export interface IPendingTx extends Document {
  userId: string;
  amount: number;
  description: string;
  suggestedType: "income" | "expense" | "unknown";
  imageInfo: string;
  expiresAt: Date;
  createdAt: Date;
}

const PendingTxSchema = new Schema<IPendingTx>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    suggestedType: { type: String, enum: ["income", "expense", "unknown"], default: "unknown" },
    imageInfo: { type: String, default: "" },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) }, // 30 นาที
  },
  { timestamps: true }
);

// Auto-delete หลัง 30 นาที
PendingTxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingTx =
  mongoose.models.PendingTx ||
  mongoose.model<IPendingTx>("PendingTx", PendingTxSchema);
