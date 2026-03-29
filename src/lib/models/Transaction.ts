import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  date: string; // พ.ศ. format: 2569-03-29
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string;
  slipFileId: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true },
    note: { type: String, default: "" },
    slipFileId: { type: String, default: "" }, // เชื่อมกับ FileDoc._id (ถ้ามี slip)
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
// index สำหรับ aggregation group by type + category
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, category: 1 });

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
