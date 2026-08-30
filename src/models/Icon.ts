import mongoose, { Document, Schema, Model } from "mongoose";

export interface IIcon extends Document {
  name: string; // Lucide icon name, e.g. "ShoppingBag", "Utensils"
  label: string; // Display label, e.g. "Shopping"
  category: string; // e.g. "Finance", "Food & Dining", "Shopping", "Transport", etc.
  tags: string[]; // Search keywords
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const IconSchema = new Schema<IIcon>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: "General", trim: true },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
IconSchema.index({ category: 1, isActive: 1 });
IconSchema.index({ sortOrder: 1 });

const Icon: Model<IIcon> =
  mongoose.models.Icon || mongoose.model<IIcon>("Icon", IconSchema);

export default Icon;
