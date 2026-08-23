import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string; // "CREATE" | "UPDATE" | "DELETE" | "EMI_PAID" | "EMI_REVERSED" | "LOAN_DELETED" | "GOAL_DELETED" | "FUNDS_ADDED" | "FUNDS_WITHDRAWN"
  entityType: string; // "loan" | "goal" | "transaction" | "account" | "budget" | "category"
  entityId: string;
  entityName?: string; // Human-readable name e.g. "Home Loan", "Rakhi Goal"
  previousValue?: any;
  currentValue?: any;
  details?: {
    reason?: string;
    notes?: string;
    amountInvolved?: number;
    currency?: string;
    reversalAccountId?: string;
    reversalAccountName?: string;
    transactionsReversed?: number;
    metadata?: Record<string, any>;
  };
  createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    entityName: { type: String },
    previousValue: { type: Schema.Types.Mixed },
    currentValue: { type: Schema.Types.Mixed },
    details: {
      reason: { type: String },
      notes: { type: String },
      amountInvolved: { type: Number },
      currency: { type: String },
      reversalAccountId: { type: String },
      reversalAccountName: { type: String },
      transactionsReversed: { type: Number },
      metadata: { type: Schema.Types.Mixed },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;

