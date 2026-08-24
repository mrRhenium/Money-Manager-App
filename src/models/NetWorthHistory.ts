import mongoose, { Schema, Document } from "mongoose";

export interface INetWorthHistory extends Document {
  userId: string;
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
  createdAt: Date;
  updatedAt: Date;
}

const NetWorthHistorySchema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    netWorth: { type: Number, required: true },
    assets: { type: Number, required: true },
    liabilities: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Ensure only one entry per user per day
NetWorthHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.NetWorthHistory || mongoose.model<INetWorthHistory>("NetWorthHistory", NetWorthHistorySchema);
