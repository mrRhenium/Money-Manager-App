import { getTransactions } from "@/actions/transaction";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { getPeople } from "@/actions/person";
import { getCreditCards } from "@/actions/creditCard";
import { ExportButton } from "@/components/transactions/ExportButton";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { auth } from "@/lib/auth";

export default async function TransactionsPage() {
  const session = await auth();
  const userTimezone = (session?.user as any)?.timezone || "UTC";

  const [transactions, accounts, categories, people, creditCards] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
    getPeople(),
    getCreditCards()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track all your incomes and expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <ExportButton />
          <TransactionForm accounts={accounts} categories={categories} people={people} creditCards={creditCards} />
        </div>
      </div>

      <TransactionTable transactions={transactions} userTimezone={userTimezone} accounts={accounts} categories={categories} people={people} creditCards={creditCards} />
    </div>
  );
}
