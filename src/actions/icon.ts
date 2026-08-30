"use server";

import dbConnect from "@/lib/db";
import Icon, { IIcon } from "@/models/Icon";
import Account from "@/models/Account";
import Category from "@/models/Category";
import Budget from "@/models/Budget";
import Goal from "@/models/Goal";
import Investment from "@/models/Investment";
import InsurancePolicy from "@/models/InsurancePolicy";
import Loan from "@/models/Loan";
import RecurringBill from "@/models/RecurringBill";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SEED_ICONS } from "@/lib/iconConstants";

export interface IconUsageBreakdown {
  entity: string;
  count: number;
}

export interface IconConsumptionResult {
  isConsumed: boolean;
  totalUsage: number;
  breakdown: IconUsageBreakdown[];
}

/**
 * Ensures the database contains all seed icons. If collection is empty or missing icons, inserts them.
 */
export async function seedDefaultIconsIfEmpty() {
  await dbConnect();
  const count = await Icon.countDocuments();
  if (count === 0) {
    const docs = SEED_ICONS.map((i) => ({
      ...i,
      isDefault: true,
      isActive: true,
    }));
    await Icon.insertMany(docs);
  }
}

/**
 * Public/User Action: Fetch all active icons for form dropdowns & selectors
 */
export async function getAvailableIcons() {
  try {
    await dbConnect();
    let icons = await Icon.find({ isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .lean();

    if (!icons || icons.length === 0) {
      await seedDefaultIconsIfEmpty();
      icons = await Icon.find({ isActive: true })
        .sort({ sortOrder: 1, label: 1 })
        .lean();
    }

    return JSON.parse(JSON.stringify(icons));
  } catch (error) {
    console.error("Failed to getAvailableIcons:", error);
    // Fallback to static seed array if DB is unreachable
    return SEED_ICONS.map((i) => ({ ...i, isActive: true, isDefault: true }));
  }
}

/**
 * Admin Action: Fetch all icons with consumption count
 */
export async function getAllIconsAdmin(searchQuery?: string, category?: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    await dbConnect();
    await seedDefaultIconsIfEmpty();

    const filter: any = {};
    if (category && category !== "All") {
      filter.category = category;
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { label: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    const icons = await Icon.find(filter)
      .sort({ sortOrder: 1, category: 1, label: 1 })
      .lean();

    // Get usage stats for each icon in batch or per icon
    const iconsWithStats = await Promise.all(
      icons.map(async (icon) => {
        const consumption = await checkIconConsumption(icon.name);
        return {
          ...icon,
          usageCount: consumption.totalUsage,
          isConsumed: consumption.isConsumed,
          usages: consumption.breakdown,
        };
      })
    );

    return JSON.parse(JSON.stringify(iconsWithStats));
  } catch (error: any) {
    console.error("Failed to getAllIconsAdmin:", error);
    throw new Error(error.message || "Failed to fetch admin icons");
  }
}

/**
 * Helper / Action: Check if an icon is consumed across any of the 8 master collections
 */
export async function checkIconConsumption(iconName: string): Promise<IconConsumptionResult> {
  await dbConnect();

  const [
    accountCount,
    categoryCount,
    budgetCount,
    goalCount,
    investmentCount,
    insuranceCount,
    loanCount,
    recurringBillCount,
  ] = await Promise.all([
    Account.countDocuments({ icon: iconName }),
    Category.countDocuments({ icon: iconName }),
    Budget.countDocuments({ icon: iconName }),
    Goal.countDocuments({ icon: iconName }),
    Investment.countDocuments({ icon: iconName }),
    InsurancePolicy.countDocuments({ icon: iconName }),
    Loan.countDocuments({ icon: iconName }),
    RecurringBill.countDocuments({ icon: iconName }),
  ]);

  const breakdown: IconUsageBreakdown[] = [];
  if (accountCount > 0) breakdown.push({ entity: "Account", count: accountCount });
  if (categoryCount > 0) breakdown.push({ entity: "Category", count: categoryCount });
  if (budgetCount > 0) breakdown.push({ entity: "Budget", count: budgetCount });
  if (goalCount > 0) breakdown.push({ entity: "Goal", count: goalCount });
  if (investmentCount > 0) breakdown.push({ entity: "Investment", count: investmentCount });
  if (insuranceCount > 0) breakdown.push({ entity: "Insurance", count: insuranceCount });
  if (loanCount > 0) breakdown.push({ entity: "Loan", count: loanCount });
  if (recurringBillCount > 0) breakdown.push({ entity: "Subscription/Bill", count: recurringBillCount });

  const totalUsage = breakdown.reduce((acc, curr) => acc + curr.count, 0);

  return {
    isConsumed: totalUsage > 0,
    totalUsage,
    breakdown,
  };
}

/**
 * Admin Action: Create a new custom icon
 */
export async function createIcon(data: {
  name: string;
  label: string;
  category: string;
  tags?: string[];
  isActive?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    await dbConnect();

    const trimmedName = data.name.trim();
    const existing = await Icon.findOne({ name: trimmedName });
    if (existing) {
      return { success: false, error: `Icon with name '${trimmedName}' already exists` };
    }

    const newIcon = await Icon.create({
      name: trimmedName,
      label: data.label.trim(),
      category: data.category.trim() || "General",
      tags: data.tags || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      isDefault: false,
      sortOrder: 500,
    });

    revalidatePath("/admin/icons");
    return { success: true, icon: JSON.parse(JSON.stringify(newIcon)) };
  } catch (error: any) {
    console.error("Failed to createIcon:", error);
    return { success: false, error: error.message || "Failed to create icon" };
  }
}

/**
 * Admin Action: Update an existing icon
 */
export async function updateIcon(
  id: string,
  data: {
    label?: string;
    category?: string;
    tags?: string[];
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    await dbConnect();

    const icon = await Icon.findById(id);
    if (!icon) {
      return { success: false, error: "Icon not found" };
    }

    if (data.label !== undefined) icon.label = data.label.trim();
    if (data.category !== undefined) icon.category = data.category.trim();
    if (data.tags !== undefined) icon.tags = data.tags;
    if (data.isActive !== undefined) icon.isActive = data.isActive;
    if (data.sortOrder !== undefined) icon.sortOrder = data.sortOrder;

    await icon.save();

    revalidatePath("/admin/icons");
    return { success: true, icon: JSON.parse(JSON.stringify(icon)) };
  } catch (error: any) {
    console.error("Failed to updateIcon:", error);
    return { success: false, error: error.message || "Failed to update icon" };
  }
}

/**
 * Admin Action: Toggle Active status
 */
export async function toggleIconStatus(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    await dbConnect();
    const icon = await Icon.findById(id);
    if (!icon) {
      return { success: false, error: "Icon not found" };
    }

    icon.isActive = !icon.isActive;
    await icon.save();

    revalidatePath("/admin/icons");
    return { success: true, isActive: icon.isActive };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle status" };
  }
}

/**
 * Admin Action: Delete icon with strict consumption safety check
 */
export async function deleteIcon(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    await dbConnect();
    const icon = await Icon.findById(id);
    if (!icon) {
      return { success: false, error: "Icon not found" };
    }

    // Check consumption
    const consumption = await checkIconConsumption(icon.name);
    if (consumption.isConsumed) {
      const breakdownSummary = consumption.breakdown
        .map((b) => `${b.count} ${b.entity}${b.count > 1 ? "s" : ""}`)
        .join(", ");

      return {
        success: false,
        isConsumed: true,
        error: `Cannot delete icon '${icon.label}' (${icon.name}) because it is actively used in: ${breakdownSummary}. Please reassign or delete those items first.`,
        breakdown: consumption.breakdown,
      };
    }

    await Icon.findByIdAndDelete(id);

    revalidatePath("/admin/icons");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to deleteIcon:", error);
    return { success: false, error: error.message || "Failed to delete icon" };
  }
}

/**
 * Admin Action: Reseed and sync all default system icons
 */
export async function reseedDefaultIcons() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    await dbConnect();

    let addedCount = 0;
    for (const seed of SEED_ICONS) {
      const exists = await Icon.findOne({ name: seed.name });
      if (!exists) {
        await Icon.create({
          ...seed,
          isDefault: true,
          isActive: true,
        });
        addedCount++;
      }
    }

    revalidatePath("/admin/icons");
    return { success: true, message: `Successfully synced default icons (${addedCount} added)` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to sync icons" };
  }
}
