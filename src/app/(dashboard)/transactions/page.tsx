import { getTransactions } from "@/actions/transaction";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { ExportButton } from "@/components/transactions/ExportButton";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { formatDate } from "@/lib/helpers";
import { auth } from "@/lib/auth";

export default async function TransactionsPage() {
  const session = await auth();
  const userTimezone = (session?.user as any)?.timezone || "UTC";

  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track all your incomes and expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportButton />
          <TransactionForm accounts={accounts} categories={categories} />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Account</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t: any) => (
                    <tr key={t._id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(t.date, "standard", userTimezone)}
                      </td>
                      <td className="px-6 py-4 capitalize">{t.type}</td>
                      <td className="px-6 py-4">
                        {t.categoryId ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.categoryId.color }} />
                            <span>{t.categoryId.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{t.accountId?.name || "-"}</td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        t.type === "income" ? "text-emerald-500" : 
                        (t.type === "expense" ? "text-red-500" : "")
                      }`}>
                        {t.type === "expense" || t.type === "lend" ? "-" : "+"}
                        ₹{t.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
