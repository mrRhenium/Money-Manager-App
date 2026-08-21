"use server";

import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Convert Mongoose documents to plain objects for passing to Client Components
  const categories = await Category.find({ userId: session.user.id })
    .sort({ type: 1, name: 1 })
    .lean();
    
  return JSON.parse(JSON.stringify(categories));
}

export async function createCategory(data: { name: string; type: "expense" | "income"; icon?: string; color?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  if (data.color) {
    const standardizedColor = data.color.toLowerCase();
    const existing = await Category.findOne({
      $or: [
        { userId: session.user.id },
        { isSystem: true }
      ],
      color: { $regex: new RegExp(`^${standardizedColor}$`, "i") }
    });
    if (existing) {
      throw new Error("This color code is already in use by another category.");
    }
  }
  
  const category = await Category.create({
    ...data,
    userId: session.user.id,
    isSystem: false,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/");
  
  return JSON.parse(JSON.stringify(category));
}

import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Check if category is used in any transactions
  const txCount = await Transaction.countDocuments({ categoryId: id });
  if (txCount > 0) {
    throw new Error(`This Category cannot be deleted because it is used in ${txCount} transaction(s).`);
  }

  // Check if category is used in any budgets
  const budgetCount = await Budget.countDocuments({ categoryId: id });
  if (budgetCount > 0) {
    throw new Error(`This Category cannot be deleted because it is used in ${budgetCount} budget(s).`);
  }

  // Prevent deleting system categories or categories belonging to other users
  await Category.findOneAndDelete({ _id: id, userId: session.user.id, isSystem: false });

  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function updateCategory(id: string, data: { name: string; type: "expense" | "income"; color: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  if (data.color) {
    const standardizedColor = data.color.toLowerCase();
    const existing = await Category.findOne({
      _id: { $ne: id },
      $or: [
        { userId: session.user.id },
        { isSystem: true }
      ],
      color: { $regex: new RegExp(`^${standardizedColor}$`, "i") }
    });
    if (existing) {
      throw new Error("This color code is already in use by another category.");
    }
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, userId: session.user.id, isSystem: false },
    { $set: { name: data.name, type: data.type, color: data.color } },
    { new: true }
  );

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/");

  return JSON.parse(JSON.stringify(category));
}
