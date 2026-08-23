import mongoose, { Schema, Document, Model } from "mongoose";

export type InsurancePolicyType = "Life" | "Health" | "Vehicle" | "Home" | "Travel" | "Other";

export interface IInsurancePolicy extends Document {
  userId: mongoose.Types.ObjectId;
  type: InsurancePolicyType;
  policyName: string;
  provider: string;
  policyNumber?: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: "Monthly" | "Quarterly" | "HalfYearly" | "Yearly" | "OneTime";
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  linkedAccountId?: mongoose.Types.ObjectId;
  status: "active" | "lapsed" | "matured" | "claimed" | "cancelled";
  currency: string;
  color?: string;
  icon?: string;
  nomineeName?: string;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InsurancePolicySchema: Schema<IInsurancePolicy> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Life", "Health", "Vehicle", "Home", "Travel", "Other"],
      required: true,
    },
    policyName: { type: String, required: true },
    provider: { type: String, required: true },
    policyNumber: { type: String },
    coverageAmount: { type: Number, required: true },
    premiumAmount: { type: Number, required: true },
    premiumFrequency: { 
      type: String, 
      enum: ["Monthly", "Quarterly", "HalfYearly", "Yearly", "OneTime"], 
      required: true 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    renewalDate: { type: Date },
    linkedAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    status: { 
      type: String, 
      enum: ["active", "lapsed", "matured", "claimed", "cancelled"], 
      default: "active" 
    },
    currency: { type: String, default: "INR" },
    color: { type: String, default: "#10b981" },
    icon: { type: String, default: "Shield" },
    nomineeName: { type: String },
    documentUrl: { type: String },
  },
  { timestamps: true }
);

InsurancePolicySchema.index({ userId: 1 });

const InsurancePolicy: Model<IInsurancePolicy> =
  mongoose.models.InsurancePolicy || mongoose.model<IInsurancePolicy>("InsurancePolicy", InsurancePolicySchema);

export default InsurancePolicy;
