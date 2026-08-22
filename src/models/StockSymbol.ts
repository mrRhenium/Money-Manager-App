import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockSymbol extends Document {
  ticker: string;
  companyName: string;
  exchange: "NSE" | "BSE" | "Other";
  latestPrice?: number;
  latestPriceDate?: Date;
  lastFetchedAt?: Date;
  lastFetchStatus?: "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const StockSymbolSchema: Schema<IStockSymbol> = new Schema(
  {
    ticker: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    exchange: { type: String, enum: ["NSE", "BSE", "Other"], default: "NSE" },
    latestPrice: { type: Number },
    latestPriceDate: { type: Date },
    lastFetchedAt: { type: Date },
    lastFetchStatus: { type: String, enum: ["success", "failed"] },
  },
  { timestamps: true }
);

// Indexes for fast searching
StockSymbolSchema.index({ companyName: "text", ticker: "text" });
StockSymbolSchema.index({ ticker: 1 });

const StockSymbol: Model<IStockSymbol> =
  mongoose.models.StockSymbol || mongoose.model<IStockSymbol>("StockSymbol", StockSymbolSchema);

export default StockSymbol;
