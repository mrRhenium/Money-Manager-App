"use server";

import dbConnect from "@/lib/db";
import RecurringBill from "@/models/RecurringBill";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import { auth } from "@/lib/auth";
import { parseToDate, getCurrentDate, getStartOfDay } from "@/lib/dateTimeHelper";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/actions/auditLog";

export async function getRecurringBills() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const bills = await RecurringBill.find({ userId: session.user.id })
    .sort({ nextDueDate: 1 })
    .populate("categoryId", "name icon color")
    .populate("accountId", "name type")
    .lean();
    
  const billsWithTxCount = await Promise.all(bills.map(async (bill) => {
    const transactionsCount = await Transaction.countDocuments({ recurringBillId: bill._id });
    return { ...bill, transactionsCount };
  }));

  return JSON.parse(JSON.stringify(billsWithTxCount));
}

export async function createRecurringBill(data: {
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  nextDueDate: string;
  autoPayPlatform?: string;
  categoryId?: string;
  accountId?: string;
  isActive?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const bill = await RecurringBill.create({
    ...data,
    userId: session.user.id,
    nextDueDate: parseToDate(data.nextDueDate),
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  await logAuditEvent("RecurringBill", bill._id.toString(), "CREATE", undefined, bill);

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

  const oldBill = await RecurringBill.findOne({ _id: id, userId: session.user.id });
  if (!oldBill) throw new Error("Bill not found");

  const bill = await RecurringBill.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    data,
    { returnDocument: 'after' }
  );

  await logAuditEvent("RecurringBill", id, "UPDATE", oldBill, bill);

  revalidatePath("/subscriptions");
  return JSON.parse(JSON.stringify(bill));
}

export async function deleteRecurringBill(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    const bill = await RecurringBill.findOne({ _id: id, userId: session.user.id });
    if (!bill) return { success: false, error: "Subscription not found" };

    const txCount = await Transaction.countDocuments({ recurringBillId: id });
    if (txCount > 0) {
      if (!reason || !notes) {
        return { success: false, error: "Reason and notes are mandatory for deleting a utilized subscription." };
      }
      
      await logAuditEvent("RecurringBill", id, "DELETE", bill, { reason, notes, transactionsRetained: txCount });
    } else {
      await logAuditEvent("RecurringBill", id, "DELETE", bill, undefined);
    }

    await RecurringBill.deleteOne({ _id: id, userId: session.user.id });

    revalidatePath("/subscriptions");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete subscription" };
  }
}

export async function markSubscriptionPaid(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  await dbConnect();
  
  const bill = await RecurringBill.findOne({ _id: id, userId: session.user.id });
  if (!bill) return { success: false, error: "Subscription not found" };

  const today = getStartOfDay();
  const dueDay = getStartOfDay(new Date(bill.nextDueDate));
  if (dueDay.getTime() > today.getTime()) {
    return { success: false, error: "Cannot mark paid before the due date." };
  }
  
  if (!bill.accountId) return { success: false, error: "No bank account is linked to this subscription." };
  
  const account = await Account.findOne({ _id: bill.accountId, userId: session.user.id });
  if (!account) return { success: false, error: "Linked bank account not found." };

  if (account.balance < bill.amount) {
    return { success: false, error: "Insufficient balance in the linked account." };
  }

  // Create Transaction
  const tx = await Transaction.create({
    userId: session.user.id,
    type: "expense",
    amount: bill.amount,
    date: getCurrentDate(),
    accountId: bill.accountId,
    categoryId: bill.categoryId,
    recurringBillId: bill._id,
    paymentMode: "bank",
    note: `Auto-payment for ${bill.name}`,
    status: "completed"
  });

  // Deduct from account
  account.balance -= bill.amount;
  await account.save();

  // Advance due date
  const nextDate = new Date(bill.nextDueDate);
  if (bill.frequency === "monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (bill.frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (bill.frequency === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  
  bill.nextDueDate = nextDate;
  await bill.save();

  await logAuditEvent("RecurringBill", id, "PAYMENT", null, { transactionId: tx._id, amount: bill.amount });

  revalidatePath("/subscriptions");
  return { success: true };
}
