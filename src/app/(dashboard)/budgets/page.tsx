import { getBudgetsWithProgress } from "@/actions/budget";
import { getCategories } from "@/actions/category";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { BudgetList } from "@/components/lists/BudgetList";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";

export default async function BudgetsPage(props: { searchParams: Promise<{ month?: string }> }) {
  const searchParams = await props.searchParams;
  const currentMonth = searchParams.month || getCurrentFormatted("YYYY-MM");
  
  const [budgets, categories] = await Promise.all([
    getBudgetsWithProgress(currentMonth),
    getCategories()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage your spending limits.</p>
        </div>
        <BudgetForm categories={categories} />
      </div>

      <BudgetList budgets={budgets} categories={categories} selectedMonth={currentMonth} />
    </div>
  );
}
