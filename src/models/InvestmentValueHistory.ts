import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvestmentValueHistory extends Document {
  investmentId: mongoose.Types.ObjectId;
  date: Date;
  value: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentValueHistorySchema: Schema<IInvestmentValueHistory> = new Schema(
  {
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment", required: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

InvestmentValueHistorySchema.index({ investmentId: 1, date: -1 });

const InvestmentValueHistory: Model<IInvestmentValueHistory> =
  mongoose.models.InvestmentValueHistory || mongoose.model<IInvestmentValueHistory>("InvestmentValueHistory", InvestmentValueHistorySchema);

export default InvestmentValueHistory;
