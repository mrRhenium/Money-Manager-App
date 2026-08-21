"use server";

import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getStartOfMonth, getEndOfMonth } from "@/lib/dateTimeHelper";

export async function getBudgetsWithProgress(month: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const budgets = await Budget.find({ userId: session.user.id, month })
    .populate("categoryId", "name icon color")
    .lean();

  // Get start and end dates for the month
  const startDate = getStartOfMonth(month);
  const endDate = getEndOfMonth(month);

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      // Find all expenses in this category for the month
      const expenses = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(session.user.id),
            categoryId: budget.categoryId._id,
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
          },
        },
      ]);

      const totalSpent = expenses.length > 0 ? expenses[0].totalSpent : 0;
      const progress = Math.min((totalSpent / budget.amount) * 100, 100);

      return {
        ...budget,
        totalSpent,
        progress,
      };
    })
  );

  return JSON.parse(JSON.stringify(budgetsWithProgress));
}

export async function upsertBudget(data: { categoryId: string; month: string; amount: number; rollover?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const budget = await Budget.findOneAndUpdate(
    { userId: session.user.id, categoryId: data.categoryId, month: data.month },
    { ...data, userId: session.user.id },
    { new: true, upsert: true }
  );

  revalidatePath("/budgets");
  
  return JSON.parse(JSON.stringify(budget));
}

export async function deleteBudget(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await Budget.findOneAndDelete({ _id: id, userId: session.user.id });

  revalidatePath("/budgets");
}

export async function updateBudget(id: string, data: { amount: number; categoryId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const budget = await Budget.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { amount: data.amount, categoryId: data.categoryId } },
    { new: true }
  );

  revalidatePath("/budgets");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(budget));
}
