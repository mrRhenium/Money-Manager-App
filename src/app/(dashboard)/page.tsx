import React from "react";
import { getAccounts } from "@/actions/account";
import { getTransactions } from "@/actions/transaction";
import { getPeople } from "@/actions/person";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { ArrowUpRight, ArrowDownRight, Wallet, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [accounts, transactions, people] = await Promise.all([
    getAccounts(),
    getTransactions(100), // Get recent 100 for dashboard
    getPeople(),
  ]);

  const totalBalance = accounts.reduce((acc: number, curr: any) => acc + curr.balance, 0);

  // Calculate current month's income and expenses
  const now = new Date();
  const currentMonthTxns = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTxns
    .filter((t: any) => t.type === "income")
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const monthlyExpense = currentMonthTxns
    .filter((t: any) => t.type === "expense")
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  // Group expenses by category for pie chart
  const expenseByCategory: Record<string, { value: number; color: string }> = {};
  currentMonthTxns.forEach((t: any) => {
    if (t.type === "expense" && t.categoryId) {
      const catName = t.categoryId.name;
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = { value: 0, color: t.categoryId.color || "#8884d8" };
      }
      expenseByCategory[catName].value += t.amount;
    }
  });

  const chartData = Object.keys(expenseByCategory).map((name) => ({
    name,
    ...expenseByCategory[name],
  }));

  const totalOweUs = people.filter((p: any) => p.netBalance > 0).reduce((acc: number, p: any) => acc + p.netBalance, 0);
  const totalWeOwe = people.filter((p: any) => p.netBalance < 0).reduce((acc: number, p: any) => acc + Math.abs(p.netBalance), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is an overview of your finances this month.
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Balance</h3>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold">₹{totalBalance.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Income (This Month)</h3>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-emerald-500">+₹{monthlyIncome.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Expenses (This Month)</h3>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-red-500">-₹{monthlyExpense.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">People Ledger Net</h3>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="pt-2 flex flex-col gap-1">
            <div className="text-sm font-medium text-emerald-500">To Receive: ₹{totalOweUs.toLocaleString("en-IN")}</div>
            <div className="text-sm font-medium text-red-500">To Pay: ₹{totalWeOwe.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Charts */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
          <OverviewChart data={chartData} />
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Link href="/transactions" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4 flex-1 overflow-auto max-h-[300px]">
            {transactions.slice(0, 5).map((t: any) => (
              <div key={t._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white" 
                    style={{ backgroundColor: t.categoryId?.color || (t.type === 'income' ? '#10b981' : '#f43f5e') }}
                  >
                    {t.categoryId?.name.charAt(0) || t.type.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{t.categoryId?.name || t.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {t.type === 'expense' || t.type === 'lend' ? '-' : '+'}₹{t.amount.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No transactions yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
