import mongoose, { Schema, Document } from "mongoose";

export interface ISavingsGoal extends Document {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // พ.ศ. format
  icon: string;
  createdAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: String, default: "" },
    icon: { type: String, default: "🎯" },
  },
  { timestamps: true }
);

export const SavingsGoal =
  mongoose.models.SavingsGoal ||
  mongoose.model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);
