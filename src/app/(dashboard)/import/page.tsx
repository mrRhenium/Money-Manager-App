import { StatementImporter } from "@/components/import/StatementImporter";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ImportPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* HEADER SECTION */}
      <div className="shrink-0 h-20 z-40 dark:text-white bg-background/95 dark:bg-card/95 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] border-b py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/transactions">
              <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-10 w-10 shrink-0">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Import Statements
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload CSV or Excel bank statements to quickly log multiple transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8 w-full">
        <div className="max-w-5xl mx-auto space-y-6">
          <StatementImporter accounts={accounts} categories={categories} />
        </div>
      </div>
    </div>
  );
}
