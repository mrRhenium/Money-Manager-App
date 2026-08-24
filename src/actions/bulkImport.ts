"use server";

import dbConnect from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function bulkInsertTransactions(transactions: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const results = { success: 0, failed: 0 };
  
  if (transactions.length === 0) return results;

  const Transaction = (await import("@/models/Transaction")).default;
  const Account = (await import("@/models/Account")).default;
  const { logAuditEvent } = await import("@/actions/auditLog");

  const toInsert = transactions.map(txn => ({
    ...txn,
    userId: session.user.id,
    paymentSource: "manual_entry",
    originalAmount: txn.amount, // Default to amount for basic bulk imports
    originalCurrency: "INR",
    exchangeRate: 1,
    status: "completed",
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  try {
    // 1. Bulk Insert Transactions
    const insertedDocs = await Transaction.insertMany(toInsert, { ordered: false });
    results.success = insertedDocs.length;

    // 2. Aggregate balance changes per account
    const balanceChanges: Record<string, number> = {};
    for (const doc of insertedDocs) {
      if (doc.accountId) {
        const accId = doc.accountId.toString();
        const amount = doc.amount || 0;
        const change = doc.type === 'income' ? amount : -amount;
        balanceChanges[accId] = (balanceChanges[accId] || 0) + change;
      }
    }

    // 3. Bulk Update Accounts
    const bulkAccountOps = Object.keys(balanceChanges).map(accId => ({
      updateOne: {
        filter: { _id: accId, userId: session.user.id },
        update: { $inc: { balance: balanceChanges[accId] } }
      }
    }));

    if (bulkAccountOps.length > 0) {
      await Account.bulkWrite(bulkAccountOps);
    }

    await logAuditEvent("Transaction", "bulk", "CREATE", undefined, { count: insertedDocs.length });

  } catch (e: any) {
    console.error("Failed to insert transactions in bulk", e);
    // If ordered: false, it inserts what it can and throws BulkWriteError for the rest
    if (e.name === 'BulkWriteError' && e.insertedDocs) {
        results.success = e.insertedDocs.length;
        results.failed = transactions.length - e.insertedDocs.length;
    } else {
        results.failed = transactions.length;
        throw new Error(e.message || "Bulk import failed entirely.");
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  
  return results;
}
