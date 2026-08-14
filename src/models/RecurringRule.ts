import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurringRule extends Document {
  userId: mongoose.Types.ObjectId;
  transactionTemplate: {
    type: string;
    amount: number;
    accountId: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    note?: string;
  };
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextRunDate: Date;
  active: boolean;
  createdAt: Date;
}

const RecurringRuleSchema: Schema<IRecurringRule> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionTemplate: {
      type: { type: String, required: true },
      amount: { type: Number, required: true },
      accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
      categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
      note: { type: String },
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    nextRunDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecurringRuleSchema.index({ nextRunDate: 1, active: 1 });

const RecurringRule: Model<IRecurringRule> =
  mongoose.models.RecurringRule || mongoose.model<IRecurringRule>("RecurringRule", RecurringRuleSchema);

export default RecurringRule;
