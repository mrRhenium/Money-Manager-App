import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  month: string; // Format: "YYYY-MM"
  amount: number;
  rollover: boolean; // Unused budget carries over to next month
  color?: string;
  icon?: string;
  createdAt: Date;
}

const BudgetSchema: Schema<IBudget> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    month: { type: String, required: true }, // e.g. "2024-08"
    amount: { type: Number, required: true },
    rollover: { type: Boolean, default: false },
    color: { type: String, default: "#f59e0b" },
    icon: { type: String, default: "PiggyBank" },
  },
  { timestamps: true }
);

// Compound index to ensure 1 budget per category per month per user
BudgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
