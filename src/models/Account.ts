import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "bank" | "cash" | "card" | "wallet";
  balance: number;
  creditLimit?: number; // Only applicable for cards
  color?: string;
  icon?: string;
  isLiability: boolean;
  createdAt: Date;
}

const AccountSchema: Schema<IAccount> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["bank", "cash", "card", "wallet"],
      required: true,
    },
    balance: { type: Number, default: 0 },
    creditLimit: { type: Number },
    color: { type: String },
    icon: { type: String },
    isLiability: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1 });

const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
