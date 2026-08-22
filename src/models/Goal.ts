import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
  status: "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema<IGoal> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date },
    color: { type: String, default: "#3b82f6" },
    icon: { type: String, default: "Target" },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;
