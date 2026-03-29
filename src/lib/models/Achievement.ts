import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  userId: string;
  type: string; // streak_7, streak_30, savings_goal, budget_under, first_tx
  title: string;
  icon: string;
  earnedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, default: "🏅" },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AchievementSchema.index({ userId: 1, type: 1 }, { unique: true });

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);
