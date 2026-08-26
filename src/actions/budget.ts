"use server";

import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getStartOfMonth, getEndOfMonth } from "@/lib/dateTimeHelper";
import { logAuditEvent, createAuditLog } from "@/actions/auditLog";

export async function getBudgetsWithProgress(options: { month?: string, startDate?: string, endDate?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  let filterStart: Date, filterEnd: Date;
  let matchQuery: any;
  
  if (options.startDate && options.endDate) {
    filterStart = new Date(options.startDate);
    filterEnd = new Date(options.endDate);
    matchQuery = {
      userId: session.user.id,
      $or: [
        { type: "custom", startDate: { $lte: filterEnd }, endDate: { $gte: filterStart } }
      ]
    };
  } else if (options.month) {
    filterStart = getStartOfMonth(options.month);
    filterEnd = getEndOfMonth(options.month);
    matchQuery = {
      userId: session.user.id,
      $or: [
        { type: { $ne: "custom" }, month: options.month },
        { type: "monthly", month: options.month },
        { type: "custom", startDate: { $lte: filterEnd }, endDate: { $gte: filterStart } }
      ]
    };
  } else {
    // default to current month
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    filterStart = getStartOfMonth(currentMonth);
    filterEnd = getEndOfMonth(currentMonth);
    matchQuery = {
      userId: session.user.id,
      $or: [
        { type: { $ne: "custom" }, month: currentMonth },
        { type: "monthly", month: currentMonth },
        { type: "custom", startDate: { $lte: filterEnd }, endDate: { $gte: filterStart } }
      ]
    };
  }

  const budgets = await Budget.find({ ...matchQuery, status: { $ne: "archived" } })
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
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    let bStart: Date, bEnd: Date;
    if (data.type === "custom") {
      if (!data.startDate || !data.endDate) return { success: false, error: "Start and End dates are required for custom budgets" };
      bStart = new Date(data.startDate);
      bEnd = new Date(data.endDate);
      if (bEnd <= bStart) return { success: false, error: "End date must be after start date" };
    } else {
      if (!data.month) return { success: false, error: "Month is required for monthly budgets" };
      bStart = getStartOfMonth(data.month);
      bEnd = getEndOfMonth(data.month);
    }

    // Check for overlaps
    const existingBudgets = await Budget.find({
      userId: session.user.id,
      categoryId: data.categoryId,
      status: { $ne: "archived" },
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
        return { success: false, error: "A budget for this category already exists in the selected date range." };
      }
    }

    let budget;
    if (data._id) {
      const oldBudget = await Budget.findById(data._id);
      budget = await Budget.findOneAndUpdate(
        { _id: data._id, userId: session.user.id },
        { ...data, userId: session.user.id },
        { returnDocument: 'after' }
      );
      if (!budget) return { success: false, error: "Budget not found" };
      await logAuditEvent("Budget", budget._id.toString(), "UPDATE", oldBudget, budget);
    } else {
      budget = await Budget.create({ ...data, userId: session.user.id });
      await logAuditEvent("Budget", budget._id.toString(), "CREATE", undefined, budget);
    }

    revalidatePath("/budgets");
    revalidatePath("/");
    
    return { success: true, budget: JSON.parse(JSON.stringify(budget)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save budget" };
  }
}

export async function deleteBudget(id: string, reason?: string, notes?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();

    const budget = await Budget.findOne({ _id: id, userId: session.user.id });
    if (!budget) return { success: false, error: "Budget not found" };

    let bStart: Date, bEnd: Date;
    if (budget.type === "custom") {
      bStart = budget.startDate as Date;
      bEnd = budget.endDate as Date;
    } else {
      bStart = getStartOfMonth(budget.month);
      bEnd = getEndOfMonth(budget.month);
    }

    const expenses = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(session.user.id),
          categoryId: budget.categoryId,
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

    const category = await Category.findById(budget.categoryId);
    const categoryName = category?.name || "Budget";
    const entityName = `${categoryName} Budget`;

    if (totalSpent > 0) {
      if (!reason || !notes) {
        return { success: false, error: "Reason and notes are mandatory for deleting a utilized budget." };
      }
      
      await createAuditLog({
        action: "DELETE",
        entityType: "Budget",
        entityId: id,
        entityName,
        previousValue: budget,
        details: { reason, notes, amountInvolved: totalSpent }
      });
      await Budget.updateOne({ _id: id }, { $set: { status: "archived" } });
    } else {
      await createAuditLog({
        action: "DELETE",
        entityType: "Budget",
        entityId: id,
        entityName,
        previousValue: budget
      });
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
    status: { $ne: "archived" },
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
