import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  previousValue?: any;
  currentValue?: any;
  createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    previousValue: { type: Schema.Types.Mixed },
    currentValue: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
