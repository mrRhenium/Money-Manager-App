import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType =
  | "expense"
  | "income"
  | "lend"
  | "borrow"
  | "settlement"
  | "transfer"
  | "investment";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  date: Date;
  accountId?: mongoose.Types.ObjectId;
  paymentMode?: "cash" | "bank" | "credit_card" | "wallet";
  creditCardId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  personId?: mongoose.Types.ObjectId; // For lend/borrow
  note?: string;
  tags?: string[];
  receiptUrl?: string;
  upiRef?: string;
  paymentSource?: "manual_entry" | "upi_scan" | "upi_manual" | "payee_quickpay";
  status?: "completed" | "pending" | "cancelled" | "awaiting_confirmation";
  upiPayeeName?: string;
  upiPayeeVpa?: string;
  createdAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "expense",
        "income",
        "lend",
        "borrow",
        "settlement",
        "transfer",
        "investment",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    originalCurrency: { type: String, default: "INR" },
    originalAmount: { type: Number },
    exchangeRate: { type: Number },
    date: { type: Date, required: true, default: Date.now },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: false },
    paymentMode: { 
      type: String, 
      enum: ["cash", "bank", "credit_card", "wallet"],
      default: "bank"
    },
    creditCardId: { type: Schema.Types.ObjectId, ref: "CreditCard" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    personId: { type: Schema.Types.ObjectId, ref: "Person" },
    note: { type: String },
    tags: [{ type: String }],
    receiptUrl: { type: String },
    upiRef: { type: String },
    paymentSource: { 
      type: String, 
      enum: ["manual_entry", "upi_scan", "upi_manual", "payee_quickpay"],
      default: "manual_entry"
    },
    status: { 
      type: String, 
      enum: ["completed", "pending", "cancelled", "awaiting_confirmation"],
      default: "completed"
    },
    upiPayeeName: { type: String },
    upiPayeeVpa: { type: String },
  },
  { timestamps: true }
);

// High performance indexes for dashboards and filtering
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });
TransactionSchema.index({ userId: 1, accountId: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
