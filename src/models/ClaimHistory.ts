import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClaimHistory extends Document {
  policyId: mongoose.Types.ObjectId;
  claimDate: Date;
  claimAmount: number;
  claimReason: string;
  claimStatus: "filed" | "approved" | "rejected" | "settled";
  settledAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimHistorySchema: Schema<IClaimHistory> = new Schema(
  {
    policyId: { type: Schema.Types.ObjectId, ref: "InsurancePolicy", required: true },
    claimDate: { type: Date, required: true },
    claimAmount: { type: Number, required: true },
    claimReason: { type: String, required: true },
    claimStatus: { 
      type: String, 
      enum: ["filed", "approved", "rejected", "settled"], 
      default: "filed" 
    },
    settledAmount: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

ClaimHistorySchema.index({ policyId: 1, claimDate: -1 });

const ClaimHistory: Model<IClaimHistory> =
  mongoose.models.ClaimHistory || mongoose.model<IClaimHistory>("ClaimHistory", ClaimHistorySchema);

export default ClaimHistory;
