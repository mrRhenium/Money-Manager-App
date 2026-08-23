"use server";

import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
    { new: true }
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

export async function deleteGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
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
