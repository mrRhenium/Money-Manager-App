import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPerson extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  relation: "Friend" | "Family" | "Colleague" | "Other";
  avatarUrl?: string;
  createdAt: Date;
}

const PersonSchema: Schema<IPerson> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String },
    relation: {
      type: String,
      enum: ["Friend", "Family", "Colleague", "Other"],
      default: "Other",
    },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

PersonSchema.index({ userId: 1 });

const Person: Model<IPerson> =
  mongoose.models.Person || mongoose.model<IPerson>("Person", PersonSchema);

export default Person;
