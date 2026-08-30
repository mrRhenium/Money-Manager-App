"use server";

import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";

interface CreateAuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
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
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.warn("Audit log creation skipped: Unauthorized");
      return null;
    }

    await dbConnect();

    // Auto-fetch entityName if missing
    if (!params.entityName) {
      try {
        const mongoose = (await import("mongoose")).default;
        const typeMap: Record<string, string> = {
          "transaction": "Transaction",
          "category": "Category",
          "account": "Account",
          "budget": "Budget",
          "recurringbill": "RecurringBill",
          "loan": "Loan",
          "investment": "Investment",
          "insurance": "InsurancePolicy",
          "insurancepolicy": "InsurancePolicy",
          "goal": "Goal",
          "person": "Person",
          "creditcard": "CreditCard"
        };
        const modelName = typeMap[params.entityType.toLowerCase()] || params.entityType;
        const Model = mongoose.models[modelName];
        if (Model && mongoose.Types.ObjectId.isValid(params.entityId)) {
          const doc: any = await Model.findById(params.entityId).lean();
          if (doc) {
            if (modelName === "Transaction") {
              const amountStr = doc.amount !== undefined ? `₹${doc.amount}` : "";
              const typeStr = doc.type ? (doc.type.charAt(0).toUpperCase() + doc.type.slice(1)) : "Transaction";
              params.entityName = doc.note?.trim() || `${typeStr} (${amountStr})`;
            } else {
              params.entityName = doc.name || doc.title || doc.policyName || doc.cardName || doc.bankName || doc.note || doc.description;
            }
          }
        }

        if (!params.entityName) {
          const snap = params.currentValue || params.previousValue;
          if (snap) {
            if (modelName === "Transaction") {
              const amountStr = snap.amount !== undefined ? `₹${snap.amount}` : "";
              const typeStr = snap.type ? (snap.type.charAt(0).toUpperCase() + snap.type.slice(1)) : "Transaction";
              params.entityName = snap.note?.trim() || `${typeStr} (${amountStr})`;
            } else {
              params.entityName = snap.name || snap.title || snap.policyName || snap.cardName || snap.bankName || snap.note || snap.description;
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch entityName for audit log", e);
      }
    }

    const auditLog = await AuditLog.create({
      userId: session.user.id,
      ...params,
    });

    return JSON.parse(JSON.stringify(auditLog));
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw, we don't want audit log failure to break the main flow
    return null;
  }
}

// Alias/Wrapper for older code that uses the 5-argument signature
export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  previousValue?: any,
  currentValue?: any
) {
  return createAuditLog({
    action,
    entityType,
    entityId,
    previousValue,
    currentValue,
  });
}

export async function getAuditLogs() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  const logs = await AuditLog.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(logs));
}
