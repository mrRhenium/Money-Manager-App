import { StatementImporter } from "@/components/import/StatementImporter";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { MasterHeader } from "@/components/layout/MasterHeader";

export default async function ImportPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">
      <MasterHeader
        backHref="/transactions"
        title="Import Statements"
        subtitle="Upload CSV or Excel bank statements to quickly log multiple transactions."
      />
      
      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8 w-full">
        <div className="max-w-5xl mx-auto space-y-6">
          <StatementImporter accounts={accounts} categories={categories} />
        </div>
      </div>
    </div>
  );
}
