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
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Import Statements</h1>
          <p className="text-muted-foreground mt-1">Upload CSV or Excel bank statements to quickly log multiple transactions.</p>
        </div>
      </div>

      <StatementImporter accounts={accounts} categories={categories} />
    </div>
  );
}
