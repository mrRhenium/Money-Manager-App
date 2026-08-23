"use server";

import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getStartOfMonth, getEndOfMonth } from "@/lib/dateTimeHelper";
import { logAuditEvent } from "@/actions/auditLog";

export async function getBudgetsWithProgress(month: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const mStart = getStartOfMonth(month);
  const mEnd = getEndOfMonth(month);

  const budgets = await Budget.find({
    userId: session.user.id,
    $or: [
      { type: { $ne: "custom" }, month: month },
      { type: "monthly", month: month },
      { type: "custom", startDate: { $lte: mEnd }, endDate: { $gte: mStart } }
    ]
  })
    .populate("categoryId", "name icon color")
    .lean();

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (budget) => {
      let bStart: Date, bEnd: Date;
      if (budget.type === "custom") {
        bStart = budget.startDate as Date;
        bEnd = budget.endDate as Date;
      } else {
        bStart = getStartOfMonth(budget.month);
        bEnd = getEndOfMonth(budget.month);
      }

      // Find all expenses in this category for the budget's specific range
      const expenses = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(session.user.id),
            categoryId: budget.categoryId?._id,
            type: "expense",
            date: { $gte: bStart, $lte: bEnd },
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
        calculatedStartDate: bStart,
        calculatedEndDate: bEnd,
      };
    })
  );

  return JSON.parse(JSON.stringify(budgetsWithProgress));
}

export async function upsertBudget(data: { 
  _id?: string;
  categoryId: string; 
  type: "monthly" | "custom";
  month?: string; 
  startDate?: string;
  endDate?: string;
  amount: number; 
  rollover?: boolean; 
  color?: string; 
  icon?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  let bStart: Date, bEnd: Date;
  if (data.type === "custom") {
    if (!data.startDate || !data.endDate) throw new Error("Start and End dates are required for custom budgets");
    bStart = new Date(data.startDate);
    bEnd = new Date(data.endDate);
    if (bEnd <= bStart) throw new Error("End date must be after start date");
  } else {
    if (!data.month) throw new Error("Month is required for monthly budgets");
    bStart = getStartOfMonth(data.month);
    bEnd = getEndOfMonth(data.month);
  }

  // Check for overlaps
  const existingBudgets = await Budget.find({
    userId: session.user.id,
    categoryId: data.categoryId,
    ...(data._id ? { _id: { $ne: data._id } } : {})
  });

  for (const eb of existingBudgets) {
    let ebStart: Date, ebEnd: Date;
    if (eb.type === "custom") {
      ebStart = eb.startDate as Date;
      ebEnd = eb.endDate as Date;
    } else {
      ebStart = getStartOfMonth(eb.month);
      ebEnd = getEndOfMonth(eb.month);
    }
    
    // overlap condition
    if (ebStart <= bEnd && ebEnd >= bStart) {
      throw new Error("A budget for this category already exists in the selected date range.");
    }
  }

  let budget;
  if (data._id) {
    const oldBudget = await Budget.findById(data._id);
    budget = await Budget.findOneAndUpdate(
      { _id: data._id, userId: session.user.id },
      { ...data, userId: session.user.id },
      { new: true }
    );
    if (!budget) throw new Error("Budget not found");
    await logAuditEvent("Budget", budget._id.toString(), "UPDATE", oldBudget, budget);
  } else {
    budget = await Budget.create({ ...data, userId: session.user.id });
    await logAuditEvent("Budget", budget._id.toString(), "CREATE", undefined, budget);
  }

  revalidatePath("/budgets");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(budget));
}

export async function deleteBudget(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const budget = await Budget.findOne({ _id: id, userId: session.user.id });
    if (budget) {
      await logAuditEvent("Budget", id, "DELETE", budget, undefined);
      await Budget.deleteOne({ _id: id });
    }

    revalidatePath("/budgets");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete budget" };
  }
}

export async function getMissingBudgets() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await dbConnect();
  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const allBudgetedCategories = await Budget.distinct("categoryId", { userId: session.user.id });

  const activeBudgets = await Budget.find({
    userId: session.user.id,
    $or: [
      { type: { $ne: "custom" }, month: monthStr },
      { type: "monthly", month: monthStr },
      { type: "custom", startDate: { $lte: today }, endDate: { $gte: today } }
    ]
  }).distinct("categoryId");

  const activeIds = activeBudgets.map(id => id.toString());
  const missingIds = allBudgetedCategories.filter(id => !activeIds.includes(id.toString()));

  if (missingIds.length === 0) return [];

  const categories = await Category.find({ _id: { $in: missingIds } }).lean();
  return JSON.parse(JSON.stringify(categories));
}
