import mongoose, { Schema, Document } from "mongoose";

export interface IDebt extends Document {
  userId: string;
  creditor: string; // เจ้าหนี้ เช่น ธ.ก.ส., กองทุนหมู่บ้าน
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  installments: number; // จำนวนงวดทั้งหมด
  paidInstallments: number;
  dueDay: number; // วันที่ต้องจ่ายในแต่ละเดือน
  startDate: string; // พ.ศ. format
  note: string;
  active: boolean;
  createdAt: Date;
}

const DebtSchema = new Schema<IDebt>(
  {
    userId: { type: String, required: true, index: true },
    creditor: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    monthlyPayment: { type: Number, required: true },
    installments: { type: Number, required: true },
    paidInstallments: { type: Number, default: 0 },
    dueDay: { type: Number, default: 1, min: 1, max: 31 },
    startDate: { type: String, default: "" },
    note: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// compound index: ค้นหาหนี้ที่ active ของ user
DebtSchema.index({ userId: 1, active: 1 });

export const Debt =
  mongoose.models.Debt ||
  mongoose.model<IDebt>("Debt", DebtSchema);
