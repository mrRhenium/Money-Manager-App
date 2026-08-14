"use server";

import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getInvestments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const investments = await Investment.find({ userId: session.user.id })
    .sort({ type: 1, name: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(investments));
}

export async function createInvestment(data: {
  type: "SIP" | "Stocks" | "FD" | "PPF" | "Gold" | "Crypto" | "Other";
  name: string;
  units?: number;
  investedAmount: number;
  currentValue: number;
  date: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const investment = await Investment.create({
    ...data,
    userId: session.user.id,
    date: new Date(data.date),
  });

  revalidatePath("/investments");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(investment));
}

export async function deleteInvestment(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await Investment.findOneAndDelete({ _id: id, userId: session.user.id });

  revalidatePath("/investments");
  revalidatePath("/");
}
