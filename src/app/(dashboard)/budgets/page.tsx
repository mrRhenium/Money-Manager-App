import React from "react";
import { getBudgetsWithProgress } from "@/actions/budget";
import { getCategories } from "@/actions/category";
import { BudgetClient } from "./BudgetClient";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";

export default async function BudgetsPage(props: { searchParams: Promise<{ month?: string; mode?: string; startDate?: string; endDate?: string }> }) {
  const searchParams = await props.searchParams;
  const currentMonth = searchParams.month || getCurrentFormatted("YYYY-MM");
  const mode = searchParams.mode || "monthly";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;
  
  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress({
      month: currentMonth,
      startDate: mode === "custom" ? startDate : undefined,
      endDate: mode === "custom" ? endDate : undefined,
    }),
    getCategories()
  ]);

  return (
    <BudgetClient 
      initialBudgets={budgets} 
      categories={categories} 
      initialMonth={currentMonth}
      initialMode={mode}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}
