import { getCategories } from "@/actions/category";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { CategoryList } from "@/components/lists/CategoryList";

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

      <CategoryList expenseCategories={expenseCategories} incomeCategories={incomeCategories} />
    </div>
  );
}
