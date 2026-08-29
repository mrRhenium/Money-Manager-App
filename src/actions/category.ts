"use server";

import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/actions/auditLog";

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Your session has expired or you are not logged in. Please sign in to continue.");

  await dbConnect();
  
  // Convert Mongoose documents to plain objects for passing to Client Components
  const categories = await Category.find({ userId: session.user.id })
    .sort({ type: 1, name: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(categories));
}

export async function createCategory(data: { name: string; type: "expense" | "income"; icon?: string; color?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    // Check duplicate name within the same type for the user
    const existingName = await Category.findOne({
      userId: session.user.id,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
      type: data.type
    });
    if (existingName) {
      return { success: false, error: `A category named "${data.name}" already exists for ${data.type}.` };
    }
    
    const category = await Category.create({
      ...data,
      userId: session.user.id,
      isSystem: false,
    });

    await logAuditEvent("Category", category._id.toString(), "CREATE", undefined, category);

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/");
    
    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (err: any) {
    console.error("Error creating category:", err);
    return { success: false, error: err.message || "Failed to create category" };
  }
}

import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import RecurringBill from "@/models/RecurringBill";
import RecurringRule from "@/models/RecurringRule";

export async function deleteCategory(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    // Check if category is used in any active transactions
    const txCount = await Transaction.countDocuments({ categoryId: id });
    if (txCount > 0) {
      return { success: false, error: `This Category cannot be deleted because it is used in ${txCount} transaction(s).` };
    }

    // Check if category is used in any budgets
    const budgetCount = await Budget.countDocuments({ categoryId: id });
    if (budgetCount > 0) {
      return { success: false, error: `This Category cannot be deleted because it is used in ${budgetCount} budget(s).` };
    }

    // Check if category is used in any recurring bills
    const billCount = await RecurringBill.countDocuments({ categoryId: id });
    if (billCount > 0) {
      return { success: false, error: `This Category cannot be deleted because it is used in ${billCount} subscription(s).` };
    }

    // Check if category is used in any recurring rules
    const ruleCount = await RecurringRule.countDocuments({ categoryId: id });
    if (ruleCount > 0) {
      return { success: false, error: `This Category cannot be deleted because it is used in ${ruleCount} automation rule(s).` };
    }

    // Fetch before delete
    const category = await Category.findOne({ _id: id, userId: session.user.id, isSystem: false });
    if (category) {
      await logAuditEvent("Category", id, "DELETE", category, undefined);
      await Category.deleteOne({ _id: id });
    }

    revalidatePath("/categories");
    revalidatePath("/transactions");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category" };
  }
}

export async function updateCategory(id: string, data: { name: string; type: "expense" | "income"; color: string; icon?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Your session has expired or you are not logged in. Please sign in to continue." };

    await dbConnect();

    const oldCategory = await Category.findOne({
      _id: id,
      $or: [{ userId: session.user.id }, { isSystem: true }]
    });

    if (!oldCategory) {
      return { success: false, error: "Category not found or unauthorized." };
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, $or: [{ userId: session.user.id }, { isSystem: true }] },
      { $set: { name: data.name, type: data.type, color: data.color, icon: data.icon } },
      { returnDocument: 'after' }
    );

    if (category) {
      await logAuditEvent("Category", id, "UPDATE", oldCategory, category);
    }

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");
    revalidatePath("/");

    return { success: true, data: JSON.parse(JSON.stringify(category)) };
  } catch (err: any) {
    console.error("Error updating category:", err);
    return { success: false, error: err.message || "Failed to update category" };
  }
}
