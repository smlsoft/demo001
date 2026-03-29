import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  userId: string;
  title: string;
  amount: number;
  dueDay: number; // วันที่ในเดือน 1-31
  category: string;
  type: "expense" | "income";
  active: boolean;
  lastNotified: string;
  createdAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, default: 0 },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    category: { type: String, default: "อื่นๆ" },
    type: { type: String, enum: ["expense", "income"], default: "expense" },
    active: { type: Boolean, default: true },
    lastNotified: { type: String, default: "" },
  },
  { timestamps: true }
);

// compound index: ค้นหา reminder ที่ active ของ user
ReminderSchema.index({ userId: 1, active: 1 });

export const Reminder =
  mongoose.models.Reminder ||
  mongoose.model<IReminder>("Reminder", ReminderSchema);
