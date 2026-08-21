import { getSystemCategories } from "@/actions/admin";
import { SystemCategoryForm } from "@/components/admin/SystemCategoryForm";
import { CategoryDeleteButton } from "@/components/admin/CategoryDeleteButton";

export default async function AdminCategoriesPage() {
  const categories = await getSystemCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Categories</h1>
          <p className="text-muted-foreground mt-1">Manage global system categories available to all users.</p>
        </div>
        <SystemCategoryForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category: any) => (
          <div key={category._id} className="rounded-xl border bg-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-lg"
                  style={{ backgroundColor: category.color || (category.type === "income" ? "#10b981" : "#f43f5e") }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${category.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {category.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <CategoryDeleteButton categoryId={category._id} />
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full p-12 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">No master categories defined.</p>
          </div>
        )}
      </div>
    </div>
  );
}
