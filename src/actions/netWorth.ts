"use server";

import dbConnect from "@/lib/db";
import NetWorthHistory from "@/models/NetWorthHistory";
import { getAccounts } from "@/actions/account";
import { getLoans } from "@/actions/loan";
import { auth } from "@/lib/auth";
import { getStartOfDay, getCurrentDate } from "@/lib/dateTimeHelper";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";

export async function snapshotNetWorth() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await dbConnect();
    
    // Check if we already have a snapshot for today
    const today = getStartOfDay();
    
    const existing = await NetWorthHistory.findOne({
      userId: session.user.id,
      date: today
    });
    
    if (existing) {
      return { success: true, message: "Snapshot already exists for today" };
    }

    // Get live exchange rates
    const rates = await fetchExchangeRates();
    
    // Get all accounts and active loans to compute snapshot
    const [accounts, loans] = await Promise.all([
      getAccounts(),
      getLoans()
    ]);

    let totalAssets = 0;
    let totalLiabilities = 0;

    // Calculate from accounts
    accounts.forEach((acc: any) => {
      const rate = getConversionRate(acc.currency || "INR", rates);
      const baseBalance = acc.balance / rate;
      if (acc.isLiability) {
        totalLiabilities += baseBalance;
      } else {
        totalAssets += baseBalance;
      }
    });

    // Calculate from active loans
    const activeLoans = loans.filter((l: any) => l.status === "active");
    activeLoans.forEach((loan: any) => {
      if (loan.type === "taken") {
        totalLiabilities += loan.outstandingBalance;
      } else if (loan.type === "given") {
        totalAssets += loan.outstandingBalance;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    await NetWorthHistory.create({
      userId: session.user.id,
      date: today,
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities
    });

    return { success: true };
  } catch (error: any) {
    console.error("Net worth snapshot error:", error);
    return { success: false, error: error.message };
  }
}

export async function getNetWorthHistory(days: number = 30) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const history = await NetWorthHistory.find({
    userId: session.user.id,
    date: { $gte: startDate }
  })
    .sort({ date: 1 })
    .lean();

  return JSON.parse(JSON.stringify(history));
}
