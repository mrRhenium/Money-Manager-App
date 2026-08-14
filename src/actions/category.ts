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

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Prevent deleting system categories or categories belonging to other users
  await Category.findOneAndDelete({ _id: id, userId: session.user.id, isSystem: false });

  revalidatePath("/categories");
  revalidatePath("/transactions");
}
