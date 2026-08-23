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
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const logs = await AuditLog.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  return JSON.parse(JSON.stringify(logs));
}
