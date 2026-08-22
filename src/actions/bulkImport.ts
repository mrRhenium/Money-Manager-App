"use server";

import dbConnect from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction } from "./transaction";

export async function bulkInsertTransactions(transactions: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const results = { success: 0, failed: 0 };
  
  for (const txn of transactions) {
    try {
      await createTransaction({
        ...txn,
        paymentSource: "manual_entry",
        status: "completed",
      });
      results.success++;
    } catch (e) {
      console.error("Failed to insert transaction in bulk", e);
      results.failed++;
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  
  return results;
}
