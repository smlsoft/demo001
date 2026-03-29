import mongoose, { Schema, Document } from "mongoose";

export interface ISavingsGroup extends Document {
  name: string;
  description: string;
  members: string[]; // userIds
  targetPerMember: number;
  createdBy: string;
  createdAt: Date;
}

export interface IGroupDeposit extends Document {
  groupId: string;
  userId: string;
  amount: number;
  date: string; // พ.ศ.
  note: string;
  createdAt: Date;
}

const SavingsGroupSchema = new Schema<ISavingsGroup>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    members: [{ type: String }],
    targetPerMember: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

const GroupDepositSchema = new Schema<IGroupDeposit>(
  {
    groupId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

GroupDepositSchema.index({ groupId: 1, userId: 1 });

export const SavingsGroup =
  mongoose.models.SavingsGroup ||
  mongoose.model<ISavingsGroup>("SavingsGroup", SavingsGroupSchema);

export const GroupDeposit =
  mongoose.models.GroupDeposit ||
  mongoose.model<IGroupDeposit>("GroupDeposit", GroupDepositSchema);
