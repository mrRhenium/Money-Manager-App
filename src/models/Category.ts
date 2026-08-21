import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  type: "expense" | "income";
  icon?: string;
  color?: string;
  isSystem: boolean; // True for default categories created upon signup
  createdAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    type: { type: String, enum: ["expense", "income"], required: true },
    icon: { type: String, default: "Circle" }, // Lucide icon name
    color: { type: String, default: "#3b82f6" }, // Default blue
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for faster querying
CategorySchema.index({ userId: 1, type: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
