import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  image?: string;
  lastActiveDate?: Date;
  currentStreak: number;
  upiIds?: string[];
  qrCode?: string;
  currency: string;
  monthlyIncome?: number;
  pushSubscription?: any;
  role: "USER" | "ADMIN";
  isVerified?: boolean;
  verificationOtp?: string;
  verificationOtpExpiry?: Date;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  timezone?: string;
  themeColor?: string;
  isActive?: boolean;
  upiAppsConfig?: { appId: string; isActive: boolean }[];
  defaultUpiApp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    image: { type: String },
    lastActiveDate: { type: Date },
    currentStreak: { type: Number, default: 0 },
    upiIds: [{ type: String }],
    qrCode: { type: String },
    currency: { type: String, default: "INR" },
    monthlyIncome: { type: Number, default: 0 },
    pushSubscription: { type: Schema.Types.Mixed },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String },
    verificationOtpExpiry: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    timezone: { type: String, default: "UTC" },
    themeColor: { type: String },
    isActive: { type: Boolean, default: true },
    upiAppsConfig: [
      {
        appId: { type: String, required: true },
        isActive: { type: Boolean, default: true },
      },
    ],
    defaultUpiApp: { type: String, default: "default" },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
