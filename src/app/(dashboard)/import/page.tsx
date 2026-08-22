import { StatementImporter } from "@/components/import/StatementImporter";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";

export default async function ImportPage() {
  const accounts = await getAccounts();
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Import Statements</h1>
        <p className="text-muted-foreground mt-1">Upload CSV or Excel bank statements to quickly log multiple transactions.</p>
      </div>

      <StatementImporter accounts={accounts} categories={categories} />
    </div>
  );
}
