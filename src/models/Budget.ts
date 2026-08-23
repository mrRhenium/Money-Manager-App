import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  month: string; // Used for "monthly" budgets (Format: "YYYY-MM")
  type: "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
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
    month: { type: String, required: true }, // For monthly budgets or as a reference
    type: { type: String, enum: ["monthly", "custom"], default: "monthly" },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    rollover: { type: Boolean, default: false },
    color: { type: String, default: "#f59e0b" },
    icon: { type: String, default: "PiggyBank" },
  },
  { timestamps: true }
);

// We remove the unique index because we handle overlapping validations at the application layer.

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
