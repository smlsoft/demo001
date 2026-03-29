import mongoose, { Schema, Document } from "mongoose";

export interface IRecurringTx extends Document {
  userId: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  dueDay: number; // วันที่ในเดือน 1-31
  active: boolean;
  lastCreated: string; // เดือนล่าสุดที่สร้างแล้ว พ.ศ. format: 2569-03
  createdAt: Date;
}

const RecurringTxSchema = new Schema<IRecurringTx>(
  {
    userId: { type: String, required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    active: { type: Boolean, default: true },
    lastCreated: { type: String, default: "" },
  },
  { timestamps: true }
);

// compound index: ค้นหา recurring ที่ active ของ user
RecurringTxSchema.index({ userId: 1, active: 1 });

export const RecurringTx =
  mongoose.models.RecurringTx ||
  mongoose.model<IRecurringTx>("RecurringTx", RecurringTxSchema);
