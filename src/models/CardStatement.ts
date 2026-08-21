import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICardStatement extends Document {
  cardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  statementMonth: string; // e.g. "2026-08"
  statementDate: Date;
  dueDate: Date;
  totalAmount: number;
  minimumDue: number;
  amountPaid: number;
  paymentStatus: "unpaid" | "partially_paid" | "paid" | "overdue";
  paidDate?: Date;
  transactions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CardStatementSchema: Schema<ICardStatement> = new Schema(
  {
    cardId: { type: Schema.Types.ObjectId, ref: "CreditCard", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    statementMonth: { type: String, required: true },
    statementDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    totalAmount: { type: Number, default: 0 },
    minimumDue: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "overdue"],
      default: "unpaid",
    },
    paidDate: { type: Date },
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
  },
  { timestamps: true }
);

// Indexes for fast fetching
CardStatementSchema.index({ cardId: 1, statementMonth: 1 }, { unique: true });
CardStatementSchema.index({ userId: 1, paymentStatus: 1 });

const CardStatement: Model<ICardStatement> =
  mongoose.models.CardStatement || mongoose.model<ICardStatement>("CardStatement", CardStatementSchema);

export default CardStatement;
