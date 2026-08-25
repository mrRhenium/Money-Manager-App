import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMutualFundScheme extends Document {
  schemeCode: string;
  schemeName: string;
  fundHouse?: string;
  schemeCategory?: string;
  latestNAV?: number;
  latestNAVDate?: Date;
  lastFetchedAt?: Date;
  lastFetchStatus?: "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const MutualFundSchemeSchema: Schema<IMutualFundScheme> = new Schema(
  {
    schemeCode: { type: String, required: true, unique: true },
    schemeName: { type: String, required: true },
    fundHouse: { type: String },
    schemeCategory: { type: String },
    latestNAV: { type: Number },
    latestNAVDate: { type: Date },
    lastFetchedAt: { type: Date },
    lastFetchStatus: { type: String, enum: ["success", "failed"] },
  },
  { timestamps: true }
);

// Indexes for fast searching
MutualFundSchemeSchema.index({ schemeName: "text" });

const MutualFundScheme: Model<IMutualFundScheme> =
  mongoose.models.MutualFundScheme || mongoose.model<IMutualFundScheme>("MutualFundScheme", MutualFundSchemeSchema);

export default MutualFundScheme;
