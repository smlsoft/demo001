import mongoose, { Schema, Document } from "mongoose";

export interface IFileDoc extends Document {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string;
  r2Key: string; // เก็บ key ใน R2
  createdAt: Date;
}

const FileDocSchema = new Schema<IFileDoc>(
  {
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    category: {
      type: String,
      enum: ["เอกสาร", "รูปภาพ", "ใบเสร็จ", "สัญญา", "อื่นๆ"],
      default: "อื่นๆ",
    },
    description: { type: String, default: "" },
    r2Key: { type: String, required: true },
  },
  { timestamps: true }
);

export const FileDoc =
  mongoose.models.FileDoc ||
  mongoose.model<IFileDoc>("FileDoc", FileDocSchema);
