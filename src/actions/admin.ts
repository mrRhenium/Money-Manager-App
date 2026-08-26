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
  const activeUsers = await User.countDocuments({ role: "USER", isActive: { $ne: false } });
  const inactiveUsers = await User.countDocuments({ role: "USER", isActive: false });
  const totalCurrencies = await Currency.countDocuments({ isActive: true });
  const totalTransactions = await Transaction.countDocuments();

  // Aggregate user registrations by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const registrations = await User.aggregate([
    { $match: { role: "USER", createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const userRegistrationsByMonth = registrations.map(reg => ({
    month: `${monthNames[reg._id.month - 1]} ${reg._id.year}`,
    users: reg.count
  }));

  let dbSize = 0;
  try {
    const db = mongoose.connection.db;
    if (db) {
      const stats = await db.stats();
      dbSize = (stats.storageSize || 0) + (stats.indexSize || 0);
    }
  } catch (err) {
    console.warn("Could not retrieve db stats for dashboard:", err);
  }

  return { 
    totalUsers, 
    activeUsers,
    inactiveUsers,
    totalCurrencies, 
    totalTransactions,
    userRegistrationsByMonth,
    dbSize
  };
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

export async function toggleUserStatus(userId: string) {
  await requireAdmin();
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Prevent admin from deactivating themselves
  const session = await auth();
  if (user._id.toString() === session?.user?.id) {
    throw new Error("Cannot deactivate your own admin account");
  }

  user.isActive = user.isActive === undefined ? false : !user.isActive;
  await user.save();

  revalidatePath("/admin/users");
  return user.isActive;
}


export async function getDatabaseAnalytics() {
  await requireAdmin();
  await dbConnect();

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    // 1. Get Global Database Stats
    let stats: any = {};
    try {
      stats = await db.stats();
    } catch (err) {
      console.warn("db.stats() restricted, using fallback");
      stats = { db: db.databaseName, collections: 0, objects: 0, avgObjSize: 0, dataSize: 0, storageSize: 0, indexes: 0, indexSize: 0 };
    }
    
    // 2. Iterate through registered models to get collection stats
    const models = mongoose.modelNames();
    const collectionsData = [];
    let fallbackObjectsCount = 0;

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
        fallbackObjectsCount += collStats.count;
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
        fallbackObjectsCount += count;
      }
    }

    return JSON.parse(JSON.stringify({
      global: {
        dbName: stats.db || db.databaseName,
        collectionsCount: stats.collections || models.length,
        objectsCount: stats.objects || fallbackObjectsCount,
        avgObjSize: stats.avgObjSize || 0,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexesCount: stats.indexes || 0,
        indexSize: stats.indexSize || 0
      },
      collections: collectionsData.sort((a, b) => b.storageSize - a.storageSize)
    }));

  } catch (error: any) {
    console.error("Database analytics error:", error);
    throw new Error("Failed to retrieve database analytics.");
  }
}
