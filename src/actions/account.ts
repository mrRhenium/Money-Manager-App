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

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Need to ensure there are no transactions tied to this account ideally,
  // or cascade delete them. For now, simple delete.
  await Account.findOneAndDelete({ _id: id, userId: session.user.id });

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
}
