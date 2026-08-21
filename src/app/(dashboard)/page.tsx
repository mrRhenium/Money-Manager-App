import React from "react";
import { getAccounts } from "@/actions/account";
import { getTransactions } from "@/actions/transaction";
import { getPeople } from "@/actions/person";
import { getCreditCards } from "@/actions/creditCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Users, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  CreditCard as CardIcon, 
  AlertCircle,
  ArrowDownLeft,
  ArrowRightLeft,
  TrendingUp,
  Circle
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/helpers";
import { isSameMonthAndYear, getCurrentFormatted } from "@/lib/dateTimeHelper";
import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";
import { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

function getFallbackTransactionIcon(type: string) {
  const className = "w-5 h-5 text-white";
  if (type === "income") return <ArrowDownLeft className={className} />;
  if (type === "expense") return <ArrowUpRight className={className} />;
  if (type === "transfer") return <ArrowRightLeft className={className} />;
  if (type === "lend" || type === "borrow") return <Users className={className} />;
  return <Circle className={className} />;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userTimezone = (session.user as any).timezone || "UTC";

  const [accounts, transactions, people, cards] = await Promise.all([
    getAccounts(),
    getTransactions(100), // Get recent 100 for dashboard
    getPeople(),
    getCreditCards(),
  ]);

  const totalOutstanding = cards.reduce((sum: number, c: any) => sum + c.currentOutstanding, 0);

  const totalBalance = accounts.reduce((acc: number, curr: any) => acc + curr.balance, 0);

  // Calculate current month's income and expenses
  const currentMonthTxns = transactions.filter((t: any) => {
    return isSameMonthAndYear(t.date, new Date());
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
        expenseByCategory[catName] = { value: 0, color: t.categoryId.color || "#0ea5e9" }; // Default to primary blue
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
    <div className="space-y-8 pb-8">
      {/* Greeting Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Hello, {session.user.name?.split(" ")[0] || "User"} <Sparkles className="w-7 h-7 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Here is your financial overview for {getCurrentFormatted('MMMM YYYY')}.
          </p>
        </div>
        <DashboardScanTrigger />
      </div>

      <PendingConfirmationsWidget />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{totalBalance.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+₹{monthlyIncome.toLocaleString("en-IN")}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">-₹{monthlyExpense.toLocaleString("en-IN")}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lend / Borrow</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">To Receive</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₹{totalOweUs.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">To Pay</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">₹{totalWeOwe.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/credit-cards" className="block h-full">
          <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credit Cards</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CardIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{totalOutstanding.toLocaleString("en-IN")}</div>
              {totalOutstanding > 0 ? (
                 <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> Unpaid dues
                 </p>
              ) : (
                 <p className="text-xs text-muted-foreground mt-1">All clear</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Charts */}
        <Card className="md:col-span-4 border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="md:col-span-3 border-none shadow-sm hover:shadow-md transition-all flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
            <Link href="/transactions" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[320px] pr-2 custom-scrollbar">
            <div className="space-y-4">
              {transactions.slice(0, 5).map((t: any) => (
                <div key={t._id} className="flex items-center justify-between group cursor-pointer hover:bg-secondary/40 p-2 -mx-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: t.categoryId?.color || (t.type === 'income' ? '#10b981' : '#f43f5e') }}
                    >
                      {t.categoryId ? (
                        <CategoryIcon name={t.categoryId.icon} className="w-5 h-5 text-white" />
                      ) : (
                        getFallbackTransactionIcon(t.type)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{t.categoryId?.name || t.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date, 'short', userTimezone)} • {t.accountId?.name || 'Account'}</p>
                    </div>
                  </div>
                  <div className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {t.type === 'expense' || t.type === 'lend' ? '-' : '+'}₹{t.amount.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Wallet className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p>No transactions yet.</p>
                  <p className="text-xs mt-1">Add your first transaction to see activity.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
