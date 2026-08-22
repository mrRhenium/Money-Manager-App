import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPremiumPaymentHistory extends Document {
  policyId: mongoose.Types.ObjectId;
  dueDate: Date;
  paidDate?: Date;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  transactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PremiumPaymentHistorySchema: Schema<IPremiumPaymentHistory> = new Schema(
  {
    policyId: { type: Schema.Types.ObjectId, ref: "InsurancePolicy", required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "unpaid", "overdue"], default: "unpaid" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

PremiumPaymentHistorySchema.index({ policyId: 1, dueDate: -1 });

const PremiumPaymentHistory: Model<IPremiumPaymentHistory> =
  mongoose.models.PremiumPaymentHistory || mongoose.model<IPremiumPaymentHistory>("PremiumPaymentHistory", PremiumPaymentHistorySchema);

export default PremiumPaymentHistory;
