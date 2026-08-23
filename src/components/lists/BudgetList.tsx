"use client";

import { useState } from "react";
import { List, Select } from "antd";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "../forms/BudgetForm";
import { BudgetDeleteModal } from "../forms/BudgetDeleteModal";
import { deleteBudget } from "@/actions/budget";
import { Trash, Search, Calendar } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";

export function BudgetList({ 
  budgets, 
  categories, 
  selectedMonth,
  mode = "monthly",
  startDate = "",
  endDate = ""
}: { 
  budgets: any[]; 
  categories: any[]; 
  selectedMonth: string;
  mode?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredBudgets = budgets.filter((b) => 
    b.categoryId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("month", val);
    else params.delete("month");
    router.push(`?${params.toString()}`);
  };

  const handleModeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", val);
    if (val === "custom") {
      params.delete("month");
      if (!params.get("startDate")) params.set("startDate", dayjs().startOf('month').format("YYYY-MM-DD"));
      if (!params.get("endDate")) params.set("endDate", dayjs().endOf('month').format("YYYY-MM-DD"));
    } else {
      params.delete("startDate");
      params.delete("endDate");
      if (!params.get("month")) params.set("month", selectedMonth || dayjs().format("YYYY-MM"));
    }
    router.push(`?${params.toString()}`);
  };

  const handleDateChange = (field: "startDate" | "endDate", val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(field, val);
    else params.delete(field);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-card p-3 rounded-xl border shadow-sm items-center">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by category name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full bg-background"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row flex-[1.5] w-full gap-2 items-center">
          <Select 
            value={mode}
            onChange={handleModeChange}
            className="h-10 min-w-[130px] w-full sm:w-auto"
            options={[
              { label: "Monthly", value: "monthly" },
              { label: "Custom Range", value: "custom" }
            ]}
          />
          {mode === "monthly" ? (
            <Input 
              type="month" 
              value={selectedMonth}
              onChange={handleMonthChange}
              className="h-10 w-full bg-background"
            />
          ) : (
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <span className="text-[10px] text-muted-foreground absolute -top-4 left-0 hidden md:block">Start Date</span>
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  className="h-10 w-full bg-background"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-muted-foreground absolute -top-4 left-0 hidden md:block">End Date</span>
                <Input 
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="h-10 w-full bg-background"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="col-span-full p-8 text-center border rounded-xl border-dashed">
          <p className="text-muted-foreground mb-4">No budgets found.</p>
        </div>
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={filteredBudgets}
          pagination={{ pageSize: 9, position: "bottom", align: "end" }}
          renderItem={(budget: any, index: number) => {
            const isOverBudget = budget.totalSpent > budget.amount;
            const actualPercentage = (budget.totalSpent / budget.amount) * 100;
            const clampedPercentage = Math.min(actualPercentage, 100);
            
            const budgetColor = budget.color || budget.categoryId?.color || "#f59e0b";
            
            let periodText = "";
            if (budget.type === "custom" && budget.startDate && budget.endDate) {
              periodText = `${dayjs(budget.startDate).format("MMM DD")} - ${dayjs(budget.endDate).format("MMM DD, YYYY")}`;
            } else if (budget.month) {
              periodText = dayjs(budget.month + "-01").format("MMMM YYYY");
            } else {
              periodText = dayjs(selectedMonth + "-01").format("MMMM YYYY");
            }

            return (
              <List.Item>
                <div className="relative rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full justify-between group overflow-hidden">
                  
                  {/* Circular Watermark */}
                  <div 
                    className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                    style={{ backgroundColor: budgetColor }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0 p-2 rounded-full" style={{ backgroundColor: `${budgetColor}20` }}>
                          <CategoryIcon name={budget.icon || budget.categoryId?.icon} color={budgetColor} className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-semibold truncate leading-none mb-1" title={budget.categoryId?.name}>{budget.categoryId?.name}</h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {periodText}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <BudgetForm categories={categories} budget={budget} />
                        <BudgetDeleteModal budget={budget} totalSpent={budget.totalSpent} />
                      </div>
                    </div>
                    <div className="w-full space-y-3 mt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Spent / Budget</p>
                          <p className="text-sm font-semibold">{formatCurrency(budget.totalSpent)} <span className="text-muted-foreground font-normal">/ {formatCurrency(budget.amount)}</span></p>
                        </div>
                        <div className="text-right">
                          <span className={isOverBudget ? "text-red-500 font-bold" : "text-primary font-bold"}>{actualPercentage.toFixed(1)}%</span>
                          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mt-1">
                            {isOverBudget 
                              ? `OVER: ${formatCurrency(budget.totalSpent - budget.amount)}` 
                              : `LEFT: ${formatCurrency(budget.amount - budget.totalSpent)}`}
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={clampedPercentage} 
                        className="h-3" 
                        indicatorColor={isOverBudget ? "#ef4444" : budgetColor}
                      />
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
