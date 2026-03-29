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
  visionResult: string; // JSON ผลวิเคราะห์จาก AI (audit trail)
  fileId: string; // เชื่อม FileDoc._id ของ slip
  editTxId: string; // ถ้ามีค่า = กำลังแก้ไข transaction นี้ (ไม่ใช่สร้างใหม่)
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
    visionResult: { type: String, default: "" }, // เก็บ JSON ผลวิเคราะห์เต็ม
    fileId: { type: String, default: "" }, // เชื่อมกับ FileDoc._id
    editTxId: { type: String, default: "" }, // ถ้ามี = แก้ไข tx นี้แทนสร้างใหม่
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
  },
  { timestamps: true }
);

// compound index: ค้นหา pending ล่าสุดของแต่ละ user
PendingTxSchema.index({ userId: 1, createdAt: -1 });
// Auto-delete หลัง 30 นาที
PendingTxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingTx =
  mongoose.models.PendingTx ||
  mongoose.model<IPendingTx>("PendingTx", PendingTxSchema);
