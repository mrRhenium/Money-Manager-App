import mongoose, { Schema, Document, Model } from "mongoose";

export type InvestmentType = "SIP" | "MutualFund" | "Stocks" | "FD" | "RD" | "PPF" | "EPF" | "NPS" | "Gold" | "Crypto" | "Bonds" | "RealEstate" | "Other";

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  investmentType: InvestmentType;
  name: string;
  folioNumber?: string;
  platform?: string;
  schemeCode?: string;
  ticker?: string;
  investedAmount: number;
  currentValue: number;
  absoluteGain?: number;
  percentGain?: number;
  units?: number;
  purchasePrice?: number;
  currentPrice?: number;
  startDate: Date;
  maturityDate?: Date;
  interestRate?: number;
  maturityAmount?: number;
  frequency: "OneTime" | "Monthly" | "Quarterly" | "Yearly";
  linkedAccountId?: mongoose.Types.ObjectId;
  autoDebitEnabled: boolean;
  autoDebitDay?: number;
  autoPriceUpdateEnabled: boolean;
  lastAutoUpdatedAt?: Date;
  status: "active" | "matured" | "closed" | "sold";
  nextDueDate?: Date;
  lastPaidDate?: Date;
  riskCategory?: "Low" | "Medium" | "High";
  notes?: string;
  currency: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema<IInvestment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    investmentType: {
      type: String,
      enum: ["SIP", "MutualFund", "Stocks", "FD", "RD", "PPF", "EPF", "NPS", "Gold", "Crypto", "Bonds", "RealEstate", "Other"],
      required: true,
    },
    name: { type: String, required: true },
    folioNumber: { type: String },
    platform: { type: String },
    schemeCode: { type: String },
    ticker: { type: String },
    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    units: { type: Number },
    purchasePrice: { type: Number },
    currentPrice: { type: Number },
    absoluteGain: { type: Number },
    percentGain: { type: Number },
    startDate: { type: Date, required: true },
    maturityDate: { type: Date },
    interestRate: { type: Number },
    maturityAmount: { type: Number },
    frequency: { type: String, enum: ["OneTime", "Monthly", "Quarterly", "Yearly"], default: "OneTime" },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    autoDebitEnabled: { type: Boolean, default: false },
    autoDebitDay: { type: Number },
    autoPriceUpdateEnabled: { type: Boolean, default: true },
    lastAutoUpdatedAt: { type: Date },
    status: { type: String, enum: ["active", "matured", "closed", "sold"], default: "active" },
    nextDueDate: { type: Date },
    lastPaidDate: { type: Date },
    riskCategory: { type: String, enum: ["Low", "Medium", "High"] },
    notes: { type: String },
    currency: { type: String, default: "INR" },
    color: { type: String, default: "#8b5cf6" },
    icon: { type: String, default: "TrendingUp" },
  },
  { timestamps: true }
);

InvestmentSchema.index({ userId: 1 });

const Investment: Model<IInvestment> =
  mongoose.models.Investment || mongoose.model<IInvestment>("Investment", InvestmentSchema);

export default Investment;
