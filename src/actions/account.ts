"use server";

import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/actions/auditLog";

export async function getAccounts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const accounts = await Account.find({ userId: session.user.id })
    .sort({ type: 1, name: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(accounts));
}

export async function createAccount(data: { name: string; type: "bank" | "cash" | "card" | "wallet"; balance?: number; creditLimit?: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const account = await Account.create({
    ...data,
    balance: data.balance || 0,
    userId: session.user.id,
  });

  await logAuditEvent("Account", account._id.toString(), "CREATE", undefined, account);

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(account));
}

import Transaction from "@/models/Transaction";

export async function deleteAccount(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    // Check if account is used in any transactions
    const txCount = await Transaction.countDocuments({ accountId: id });
    if (txCount > 0) {
      return { success: false, error: `This Account cannot be deleted because it is used in ${txCount} transaction(s).` };
    }

    const account = await Account.findOne({ _id: id, userId: session.user.id });
    if (account) {
      await logAuditEvent("Account", id, "DELETE", account, undefined);
      await Account.deleteOne({ _id: id });
    }

    revalidatePath("/accounts");
    revalidatePath("/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete account" };
  }
}

export async function updateAccount(id: string, data: { name: string; type: "bank" | "cash" | "card" | "wallet"; balance?: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const oldAccount = await Account.findOne({ _id: id, userId: session.user.id });

  const account = await Account.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { name: data.name, type: data.type, balance: data.balance || 0 } },
    { new: true }
  );

  if (account) {
    await logAuditEvent("Account", id, "UPDATE", oldAccount, account);
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(account));
}
