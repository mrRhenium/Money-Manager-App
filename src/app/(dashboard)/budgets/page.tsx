import { getBudgetsWithProgress } from "@/actions/budget";
import { getCategories } from "@/actions/category";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { Button } from "@/components/ui/button";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";

export default async function BudgetsPage() {
  const currentMonth = getCurrentFormatted("YYYY-MM");
  
  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress(currentMonth),
    getCategories()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage your spending limits for {getCurrentFormatted('MMMM YYYY')}.</p>
        </div>
        <BudgetForm categories={categories} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground mb-4">No budgets set for this month.</p>
            <Button variant="outline">Create your first budget</Button>
          </div>
        ) : (
          budgets.map((budget: any) => {
            const isOverBudget = budget.totalSpent > budget.amount;
            return (
              <div key={budget._id} className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: budget.categoryId?.color || "#888" }} />
                    <h3 className="font-semibold">{budget.categoryId?.name}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ₹{budget.totalSpent.toLocaleString("en-IN")} / ₹{budget.amount.toLocaleString("en-IN")}
                  </span>
                </div>

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
            );
          })
        )}
      </div>
    </div>
  );
}
