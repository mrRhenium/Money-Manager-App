"use server";

import dbConnect from "@/lib/db";
import RecurringBill from "@/models/RecurringBill";
import { auth } from "@/lib/auth";
import { parseToDate } from "@/lib/dateTimeHelper";
import { revalidatePath } from "next/cache";

export async function getRecurringBills() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const bills = await RecurringBill.find({ userId: session.user.id })
    .sort({ nextDueDate: 1 })
    .populate("categoryId", "name icon color")
    .populate("accountId", "name type")
    .lean();
    
  return JSON.parse(JSON.stringify(bills));
}

export async function createRecurringBill(data: {
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  nextDueDate: string;
  autoPayPlatform?: string;
  categoryId?: string;
  accountId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const bill = await RecurringBill.create({
    ...data,
    userId: session.user.id,
    nextDueDate: parseToDate(data.nextDueDate),
  });

  revalidatePath("/subscriptions");
  return JSON.parse(JSON.stringify(bill));
}

export async function updateRecurringBill(id: string, data: Partial<any>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  if (data.nextDueDate) {
    data.nextDueDate = parseToDate(data.nextDueDate);
  }

  const bill = await RecurringBill.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    data,
    { new: true }
  );

  if (!bill) throw new Error("Bill not found");

  revalidatePath("/subscriptions");
  return JSON.parse(JSON.stringify(bill));
}

export async function deleteRecurringBill(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await RecurringBill.deleteOne({ _id: id, userId: session.user.id });

  revalidatePath("/subscriptions");
}
