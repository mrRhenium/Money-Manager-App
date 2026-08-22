import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: "taken" | "given"; // taken = liability, given = asset
  principalAmount: number;
  totalAmount: number; // Principal + Interest
  outstandingBalance: number;
  emiAmount: number;
  emiDate: number; // 1-31
  linkedAccountId?: mongoose.Types.ObjectId;
  startDate: Date;
  tenureMonths: number;
  status: "active" | "completed";
  color: string;
  icon: string;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema<ILoan> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["taken", "given"], required: true },
    principalAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    outstandingBalance: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    emiDate: { type: Number, required: true, min: 1, max: 31 },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    startDate: { type: Date, required: true },
    tenureMonths: { type: Number, required: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    color: { type: String, default: "#3b82f6" },
    icon: { type: String, default: "Landmark" },
    currency: { type: String, default: "INR" }
  },
  { timestamps: true }
);

LoanSchema.index({ userId: 1, status: 1 });

const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema);

export default Loan;
