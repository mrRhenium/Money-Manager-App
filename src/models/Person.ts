import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPerson extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phones: string[];
  relation: "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other";
  vpas: string[];
  avatarUrl?: string;
  color?: string;
  createdAt: Date;
}

const PersonSchema: Schema<IPerson> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phones: [{ type: String }],
    relation: {
      type: String,
      enum: ["Friend", "Family", "Colleague", "Merchant", "Shopkeeper", "Other"],
      default: "Other",
    },
    vpas: [{ type: String }],
    avatarUrl: { type: String },
    color: { type: String, default: "#0ea5e9" },
  },
  { timestamps: true }
);

PersonSchema.index({ userId: 1 });
PersonSchema.index({ userId: 1, name: 1 }, { unique: true });

const Person: Model<IPerson> =
  mongoose.models.Person || mongoose.model<IPerson>("Person", PersonSchema);

export default Person;
