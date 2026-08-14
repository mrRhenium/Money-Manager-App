import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  type: "SIP" | "Stocks" | "FD" | "PPF" | "Gold" | "Crypto" | "Other";
  name: string;
  units?: number;
  investedAmount: number;
  currentValue: number;
  date: Date;
  createdAt: Date;
}

const InvestmentSchema: Schema<IInvestment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["SIP", "Stocks", "FD", "PPF", "Gold", "Crypto", "Other"],
      required: true,
    },
    name: { type: String, required: true },
    units: { type: Number },
    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true }, // For MVP, user manually updates this
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

InvestmentSchema.index({ userId: 1 });

const Investment: Model<IInvestment> =
  mongoose.models.Investment || mongoose.model<IInvestment>("Investment", InvestmentSchema);

export default Investment;
