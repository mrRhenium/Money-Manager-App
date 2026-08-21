import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  lastActiveDate?: Date;
  currentStreak: number;
  upiId?: string;
  currency: string;
  monthlyIncome?: number;
  pushSubscription?: any;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    image: { type: String },
    lastActiveDate: { type: Date },
    currentStreak: { type: Number, default: 0 },
    upiId: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    monthlyIncome: { type: Number, default: 0 },
    pushSubscription: { type: Schema.Types.Mixed },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
