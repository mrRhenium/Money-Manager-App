import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICurrency extends Document {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Relative to base currency (INR)
  isActive: boolean;
  isBase: boolean;
}

const CurrencySchema = new Schema<ICurrency>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    exchangeRate: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true },
    isBase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Currency: Model<ICurrency> =
  mongoose.models.Currency || mongoose.model<ICurrency>("Currency", CurrencySchema);

export default Currency;
