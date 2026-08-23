"use server";

import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createTransaction } from "./transaction";

export async function getGoals() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goals = await Goal.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(goals));
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  deadline?: string;
  color: string;
  icon: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.create({
    ...data,
    userId: session.user.id,
    currentAmount: 0,
    status: "active",
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function updateGoal(
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    deadline?: string;
    color?: string;
    icon?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    data,
    { returnDocument: 'after' }
  );

  if (!goal) throw new Error("Goal not found");

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function addFundsToGoal(
  id: string, 
  amountToAdd: number,
  sourceAccountId?: string,
  destinationAccountId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.findOne({ _id: id, userId: session.user.id });
  if (!goal) throw new Error("Goal not found");

  // Handle transfer if both accounts are provided
  if (sourceAccountId && destinationAccountId && sourceAccountId !== destinationAccountId) {
    const sourceAcc = await Account.findOne({ _id: sourceAccountId, userId: session.user.id });
    const destAcc = await Account.findOne({ _id: destinationAccountId, userId: session.user.id });
    
    if (!sourceAcc || !destAcc) throw new Error("Account not found");
    if (sourceAcc.balance < amountToAdd) throw new Error("Insufficient balance in source account");

    sourceAcc.balance -= amountToAdd;
    destAcc.balance += amountToAdd;

    await sourceAcc.save();
    await destAcc.save();

    await Transaction.create({
      userId: session.user.id,
      type: "transfer",
      amount: amountToAdd,
      accountId: sourceAcc._id,
      toAccountId: destAcc._id,
      goalId: goal._id,
      note: `Added funds to Goal: ${goal.name}`,
    });
  }

  goal.currentAmount += amountToAdd;
  
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
  }

  await goal.save();

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function deleteGoal(id: string, reason?: string, notes?: string, returnAccountId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const goal = await Goal.findOne({ _id: id, userId: session.user.id });
  if (!goal) throw new Error("Goal not found");

  if (goal.status === "completed") {
    throw new Error("Completed goals cannot be deleted.");
  }

  // If there are funds saved, we need to reverse them
  if (goal.currentAmount > 0) {
    if (!reason || !notes || !returnAccountId) {
      throw new Error("Reason, notes, and a return account are mandatory for deleting a utilized goal.");
    }

    const returnAccount = await Account.findOne({ _id: returnAccountId, userId: session.user.id });
    if (!returnAccount) throw new Error("Return account not found");

    // Credit the return account
    returnAccount.balance += goal.currentAmount;
    await returnAccount.save();

    // Create a reversal transaction
    await createTransaction({
      type: "income",
      amount: goal.currentAmount,
      date: new Date().toISOString(),
      accountId: returnAccount._id.toString(),
      note: `Goal Deleted — Reversal: ${goal.name}. Reason: ${reason}`,
      originalCurrency: "INR",
      paymentMode: "bank",
      status: "completed",
      paymentSource: "manual_entry",
    });

    // Delete all related fund transactions
    await Transaction.deleteMany({ goalId: goal._id, userId: session.user.id });

    // Create Audit Log
    const { createAuditLog } = await import('./auditLog');
    await createAuditLog({
      action: "GOAL_DELETED",
      entityType: "goal",
      entityId: id,
      entityName: goal.name,
      details: {
        reason,
        notes,
        amountInvolved: goal.currentAmount,
        reversalAccountId: returnAccount._id.toString(),
        reversalAccountName: returnAccount.name,
      }
    });
  } else {
    // Simple deletion (unused goal)
    const { createAuditLog } = await import('./auditLog');
    await createAuditLog({
      action: "GOAL_DELETED",
      entityType: "goal",
      entityId: id,
      entityName: goal.name,
    });
  }

  await Goal.deleteOne({ _id: id, userId: session.user.id });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function withdrawFundsFromGoal(
  id: string,
  amountToWithdraw: number,
  sourceAccountId: string,
  destinationAccountId: string,
  note: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const goal = await Goal.findOne({ _id: id, userId: session.user.id });
  if (!goal) throw new Error("Goal not found");

  if (goal.currentAmount < amountToWithdraw) {
    throw new Error("Insufficient funds in goal");
  }

  if (sourceAccountId !== destinationAccountId) {
    const sourceAcc = await Account.findOne({ _id: sourceAccountId, userId: session.user.id });
    const destAcc = await Account.findOne({ _id: destinationAccountId, userId: session.user.id });
    
    if (!sourceAcc || !destAcc) throw new Error("Account not found");
    if (sourceAcc.balance < amountToWithdraw) throw new Error("Insufficient balance in source account");

    sourceAcc.balance -= amountToWithdraw;
    destAcc.balance += amountToWithdraw;

    await sourceAcc.save();
    await destAcc.save();

    await Transaction.create({
      userId: session.user.id,
      type: "transfer",
      amount: amountToWithdraw,
      accountId: sourceAcc._id,
      toAccountId: destAcc._id,
      goalId: goal._id,
      note: `Withdrawn from Goal (${goal.name}): ${note}`,
    });
  }

  goal.currentAmount -= amountToWithdraw;
  
  if (goal.currentAmount < goal.targetAmount) {
    goal.status = "active";
  }

  await goal.save();

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}
