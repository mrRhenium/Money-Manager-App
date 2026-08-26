"use server";

import dbConnect from "@/lib/db";
import mongoose from "mongoose";
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

import Currency from "@/models/Currency";

export async function getAdminStats() {
  await requireAdmin();
  await dbConnect();

  const totalUsers = await User.countDocuments({ role: "USER" });
  const totalCategories = await Category.countDocuments({ isSystem: true });
  const totalCurrencies = await Currency.countDocuments({ isActive: true });

  return { totalUsers, totalCategories, totalCurrencies };
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

export async function getDatabaseAnalytics() {
  await requireAdmin();
  await dbConnect();

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    // 1. Get Global Database Stats
    const stats = await db.stats();
    
    // 2. Iterate through registered models to get collection stats
    const models = mongoose.modelNames();
    const collectionsData = [];

    for (const modelName of models) {
      const Model = mongoose.model(modelName);
      const collectionName = Model.collection.collectionName;
      
      try {
        const collStats = await db.command({ collStats: collectionName });
        collectionsData.push({
          modelName,
          collectionName,
          count: collStats.count,
          size: collStats.size,
          storageSize: collStats.storageSize,
          avgObjSize: collStats.avgObjSize || 0
        });
      } catch (err) {
        // Fallback for restricted environments
        const count = await Model.countDocuments();
        collectionsData.push({
          modelName,
          collectionName,
          count,
          size: 0,
          storageSize: 0,
          avgObjSize: 0,
          error: "collStats restricted"
        });
      }
    }

    return JSON.parse(JSON.stringify({
      global: {
        dbName: stats.db,
        collectionsCount: stats.collections,
        objectsCount: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexesCount: stats.indexes,
        indexSize: stats.indexSize
      },
      collections: collectionsData.sort((a, b) => b.storageSize - a.storageSize)
    }));

  } catch (error: any) {
    console.error("Database analytics error:", error);
    throw new Error("Failed to retrieve database analytics.");
  }
}
