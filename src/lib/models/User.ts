import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  demoId: string;
  name: string;
  occupation: string;
  avatar: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    demoId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    occupation: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
