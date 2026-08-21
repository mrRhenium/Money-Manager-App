"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Category from "@/models/Category";
import Account from "@/models/Account";
import Budget from "@/models/Budget";
import Investment from "@/models/Investment";
import Person from "@/models/Person";
import RecurringRule from "@/models/RecurringRule";
import Transaction from "@/models/Transaction";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function getAdminStats() {
  await requireAdmin();
  await dbConnect();

  const totalUsers = await User.countDocuments({ role: "USER" });
  const totalCategories = await Category.countDocuments({ isSystem: true });

  return { totalUsers, totalCategories };
}

export async function getAllUsers() {
  await requireAdmin();
  await dbConnect();

  const users = await User.find({ role: "USER" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(users));
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  await dbConnect();

  // Cascade delete all user data
  await Promise.all([
    Account.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    Category.deleteMany({ userId, isSystem: false }),
    Investment.deleteMany({ userId }),
    Person.deleteMany({ userId }),
    RecurringRule.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  revalidatePath("/admin/users");
}

export async function getSystemCategories() {
  await requireAdmin();
  await dbConnect();

  const categories = await Category.find({ isSystem: true })
    .sort({ type: 1, name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(categories));
}

export async function createSystemCategory(data: { name: string; type: "expense" | "income"; icon?: string; color?: string }) {
  await requireAdmin();
  await dbConnect();

  const category = await Category.create({
    ...data,
    isSystem: true,
  });

  revalidatePath("/admin/categories");
  return JSON.parse(JSON.stringify(category));
}

export async function deleteSystemCategory(id: string) {
  await requireAdmin();
  await dbConnect();

  await Category.findOneAndDelete({ _id: id, isSystem: true });

  revalidatePath("/admin/categories");
}
