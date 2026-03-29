import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  userId: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    action: { type: String, default: "" },
  },
  { timestamps: true }
);

// compound index: ดึง chat history เรียงตามเวลา
ChatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
