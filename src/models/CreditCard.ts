import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICreditCard extends Document {
  userId: mongoose.Types.ObjectId;
  cardName: string;
  bankName: string;
  cardNetwork: "Visa" | "Mastercard" | "RuPay" | "Amex" | "Other";
  last4Digits: string;
  cardholderName: string;
  creditLimit: number;
  availableLimit: number;
  startingDate: Date;
  expiryDate: Date;
  billingCycleStartDay: number;
  billingCycleEndDay: number;
  paymentDueDay: number;
  minimumDuePercent: number;
  interestRatePerMonth?: number;
  currentOutstanding: number;
  status: "active" | "blocked" | "expired" | "closed";
  color?: string;
  notes?: string;
  reminderEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CreditCardSchema: Schema<ICreditCard> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardName: { type: String, required: true },
    bankName: { type: String, required: true },
    cardNetwork: {
      type: String,
      enum: ["Visa", "Mastercard", "RuPay", "Amex", "Other"],
      required: true,
    },
    last4Digits: {
      type: String,
      required: true,
      match: [/^\d{4}$/, "Must be exactly 4 digits"], // SECURITY: Only store last 4
    },
    cardholderName: { type: String, required: true },
    creditLimit: { type: Number, required: true },
    availableLimit: { type: Number, required: true },
    startingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    billingCycleStartDay: { type: Number, required: true, min: 1, max: 31 },
    billingCycleEndDay: { type: Number, required: true, min: 1, max: 31 },
    paymentDueDay: { type: Number, required: true, min: 1, max: 31 },
    minimumDuePercent: { type: Number, default: 5 },
    interestRatePerMonth: { type: Number },
    currentOutstanding: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "blocked", "expired", "closed"],
      default: "active",
    },
    color: { type: String, default: "#0ea5e9" },
    notes: { type: String },
    reminderEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
CreditCardSchema.index({ userId: 1 });
CreditCardSchema.index({ userId: 1, bankName: 1, last4Digits: 1 }, { unique: true });

const CreditCard: Model<ICreditCard> =
  mongoose.models.CreditCard || mongoose.model<ICreditCard>("CreditCard", CreditCardSchema);

export default CreditCard;
