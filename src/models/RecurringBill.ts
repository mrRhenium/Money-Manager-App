import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurringBill extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  nextDueDate: Date;
  autoPayPlatform?: string;
  categoryId?: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  isActive: boolean;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringBillSchema: Schema<IRecurringBill> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ["weekly", "monthly", "yearly"], required: true },
    nextDueDate: { type: Date, required: true },
    autoPayPlatform: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    isActive: { type: Boolean, default: true },
    color: { type: String, default: "#6366f1" },
    icon: { type: String, default: "Repeat" },
  },
  { timestamps: true }
);

RecurringBillSchema.index({ userId: 1 });
RecurringBillSchema.index({ nextDueDate: 1 });

const RecurringBill: Model<IRecurringBill> =
  mongoose.models.RecurringBill || mongoose.model<IRecurringBill>("RecurringBill", RecurringBillSchema);

export default RecurringBill;
