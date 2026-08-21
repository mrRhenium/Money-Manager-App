import { getCategories } from "@/actions/category";
import { CategoryForm } from "@/components/forms/CategoryForm";

export default async function CategoriesPage() {
  const categories = await getCategories();
  
  const expenseCategories = categories.filter((c: any) => c.type === "expense");
  const incomeCategories = categories.filter((c: any) => c.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your expense and income categories.</p>
        </div>
        <CategoryForm />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Expenses</h2>
          <div className="space-y-2">
            {expenseCategories.map((cat: any) => (
              <div key={cat._id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
              </div>
            ))}
            {expenseCategories.length === 0 && <p className="text-sm text-muted-foreground">No expense categories.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Income</h2>
          <div className="space-y-2">
            {incomeCategories.map((cat: any) => (
              <div key={cat._id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium">{cat.name}</span>
                </div>
              </div>
            ))}
            {incomeCategories.length === 0 && <p className="text-sm text-muted-foreground">No income categories.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
