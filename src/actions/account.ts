"use server";

import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(account));
}

import Transaction from "@/models/Transaction";

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Check if account is used in any transactions
  const txCount = await Transaction.countDocuments({ accountId: id });
  if (txCount > 0) {
    throw new Error(`This Account cannot be deleted because it is used in ${txCount} transaction(s).`);
  }

  await Account.findOneAndDelete({ _id: id, userId: session.user.id });

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function updateAccount(id: string, data: { name: string; type: "bank" | "cash" | "card" | "wallet"; balance?: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const account = await Account.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { name: data.name, type: data.type, balance: data.balance || 0 } },
    { new: true }
  );

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(account));
}
