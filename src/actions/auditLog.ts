"use server";

import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";

export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  previousValue?: any,
  currentValue?: any
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return; // Silent return if not logged in

    await dbConnect();

    // Clean data from raw MongoDB Document types to plain JS objects for clean JSON serialization
    const cleanPrev = previousValue ? JSON.parse(JSON.stringify(previousValue)) : undefined;
    const cleanCurr = currentValue ? JSON.parse(JSON.stringify(currentValue)) : undefined;

    await AuditLog.create({
      userId: session.user.id,
      entityType,
      entityId,
      action,
      previousValue: cleanPrev,
      currentValue: cleanCurr,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

export async function getAuditLogs() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const logs = await AuditLog.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(200); // Limit to top 200 logs for performance

  return JSON.parse(JSON.stringify(logs));
}
