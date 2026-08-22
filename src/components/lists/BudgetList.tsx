"use client";

import { List, Popconfirm, Modal } from "antd";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "../forms/BudgetForm";
import { deleteBudget } from "@/actions/budget";
import { Trash } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function BudgetList({ budgets, categories }: { budgets: any[]; categories: any[] }) {
  if (budgets.length === 0) {
    return (
      <div className="col-span-full p-8 text-center border rounded-xl border-dashed">
        <p className="text-muted-foreground mb-4">No budgets set for this month.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={budgets}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(budget: any, index: number) => {
          const isOverBudget = budget.totalSpent > budget.amount;
          return (
            <List.Item>
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 h-full justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground shrink-0">{index + 1}.</span>
                      <div className="shrink-0">
                        <CategoryIcon name={budget.icon || budget.categoryId?.icon} color={budget.color || budget.categoryId?.color} className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold truncate" title={budget.categoryId?.name}>{budget.categoryId?.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <BudgetForm categories={categories} budget={budget} />
                      <Popconfirm
                        title="Delete Budget"
                        description="Are you sure you want to delete this budget?"
                        onConfirm={async () => {
                          try {
                            const res = await deleteBudget(budget._id);
                            if (res && !res.success) {
                              Modal.error({
                                title: "Cannot Delete Budget",
                                content: res.error || "An error occurred while deleting the budget.",
                                okText: "Close",
                              });
                            }
                          } catch (err: any) {
                            Modal.error({
                              title: "Cannot Delete Budget",
                              content: err.message || "An error occurred while deleting the budget.",
                              okText: "Close",
                            });
                          }
                        }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2 text-muted-foreground">
                    <span>Spent / Target</span>
                    <span>₹{budget.totalSpent.toLocaleString("en-IN")} / ₹{budget.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all ${isOverBudget ? "bg-red-500" : "bg-primary"}`}
                      style={{ width: `${budget.progress}%` }}
                    />
                  </div>
                  
                  {isOverBudget ? (
                    <p className="text-xs font-medium text-red-500 text-right">Over budget by ₹{(budget.totalSpent - budget.amount).toLocaleString("en-IN")}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-right">₹{(budget.amount - budget.totalSpent).toLocaleString("en-IN")} remaining</p>
                  )}
                </div>
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
