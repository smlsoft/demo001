import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId: string;
  category: string;
  monthlyLimit: number;
  month: string; // พ.ศ. format: 2569-03
  createdAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    monthlyLimit: { type: Number, required: true },
    month: { type: String, required: true },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, month: 1 });
BudgetSchema.index({ userId: 1, category: 1, month: 1 });

export const Budget =
  mongoose.models.Budget ||
  mongoose.model<IBudget>("Budget", BudgetSchema);
