import React from "react";
import { getAccounts } from "@/actions/account";
import { getTransactions } from "@/actions/transaction";
import { getPeople } from "@/actions/person";
import { getCreditCards } from "@/actions/creditCard";
import { getMissingBudgets } from "@/actions/budget";
import { snapshotNetWorth, getNetWorthHistory } from "@/actions/netWorth";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
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
  Circle,
  QrCode
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/helpers";
import { isSameMonthAndYear, getCurrentDate, parseToDate, getCurrentFormatted } from "@/lib/dateTimeHelper";
import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";
import { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

import { UpcomingDuesWidget } from "@/components/dashboard/UpcomingDuesWidget";

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
  const userCurrency = (session.user as any).currency || "INR";

  const [accounts, transactions, people, cards, investments, policies, loans, missingBudgets, nwHistory] = await Promise.all([
    getAccounts(),
    getTransactions(100), // Get recent 100 for dashboard
    getPeople(),
    getCreditCards(),
    import("@/actions/investment").then(m => m.getInvestments()),
    import("@/actions/insurance").then(m => m.getInsurancePolicies()),
    import("@/actions/loan").then(m => m.getLoans()),
    getMissingBudgets(),
    getNetWorthHistory(30)
  ]);

  // Fire and forget net worth snapshot
  snapshotNetWorth().catch(console.error);

  const rates = await fetchExchangeRates();

  const totalOutstanding = cards.reduce((sum: number, c: any) => {
    const rate = getConversionRate(c.currency || "INR", rates);
    return sum + (c.currentOutstanding || 0) / rate;
  }, 0);

  const activeLoans = loans.filter((l: any) => l.status === "active");
  const totalLoansTaken = activeLoans.filter((l: any) => l.type === "taken").reduce((sum: number, l: any) => {
    const rate = getConversionRate(l.currency || "INR", rates);
    return sum + (l.outstandingBalance || 0) / rate;
  }, 0);
  const totalLoansGiven = activeLoans.filter((l: any) => l.type === "given").reduce((sum: number, l: any) => {
    const rate = getConversionRate(l.currency || "INR", rates);
    return sum + (l.outstandingBalance || 0) / rate;
  }, 0);


  const totalInvestmentValue = investments.filter((i: any) => i.status === "active").reduce((sum: number, i: any) => {
    const rate = getConversionRate(i.currency || "INR", rates);
    return sum + (i.currentValue || 0) / rate;
  }, 0);

  const totalCardOutstanding = cards.reduce((sum: number, c: any) => {
    const rate = getConversionRate(c.currency || "INR", rates);
    return sum + (c.currentOutstanding || 0) / rate;
  }, 0);

  const totalBalance = accounts.reduce((acc: number, curr: any) => {
    const rate = getConversionRate(curr.currency || "INR", rates);
    const baseBalance = curr.balance / rate;
    return curr.isLiability ? acc - baseBalance : acc + baseBalance;
  }, 0) - totalLoansTaken + totalLoansGiven + totalInvestmentValue - totalCardOutstanding;

  // Calculate current month's income and expenses
  const currentMonthTxns = transactions.filter((t: any) => {
    return isSameMonthAndYear(t.date, getCurrentDate());
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

  const upcomingDues: any[] = [];
  const now = getCurrentDate();
  const next30Days = getCurrentDate();
  next30Days.setDate(now.getDate() + 30);

  // Parse credit cards
  cards.forEach((c: any) => {
    if (c.currentOutstanding > 0 && c.dueDate) {
      let dd = parseToDate(c.dueDate);
      if (dd.getMonth() < now.getMonth() && dd.getFullYear() <= now.getFullYear()) {
        dd.setMonth(now.getMonth());
      }
      if (dd <= next30Days) {
        upcomingDues.push({ title: `${c.bankName} CC Bill`, amount: c.currentOutstanding, dueDate: dd, type: 'credit_card' });
      }
    }
  });

  // Parse investments (SIPs)
  investments.forEach((inv: any) => {
    if (inv.status === 'active' && inv.frequency === 'Monthly' && inv.startDate) {
      let nextDue = parseToDate(inv.startDate);
      nextDue.setMonth(now.getMonth());
      nextDue.setFullYear(now.getFullYear());
      if (nextDue < now) nextDue.setMonth(now.getMonth() + 1);
      if (nextDue <= next30Days) {
        upcomingDues.push({ title: `${inv.name} SIP`, amount: inv.investedAmount, dueDate: nextDue, type: 'sip' });
      }
    }
  });

  // Parse insurance policies
  policies.forEach((pol: any) => {
    if (pol.status === 'active' && pol.renewalDate) {
      let rd = parseToDate(pol.renewalDate);
      if (rd >= now && rd <= next30Days) {
        upcomingDues.push({ title: `${pol.policyName} Premium`, amount: pol.premiumAmount, dueDate: rd, type: 'insurance' });
      }
    }
  });

  // Parse active loans (EMIs)
  activeLoans.forEach((loan: any) => {
    if (loan.status === 'active' && loan.emiDate && loan.emiAmount > 0) {
      let emiDate = parseToDate(`${now.getFullYear()}-${now.getMonth() + 1}-${loan.emiDate}`);
      if (emiDate < now) emiDate.setMonth(now.getMonth() + 1);

      if (emiDate <= next30Days) {
        upcomingDues.push({ title: `${loan.name} EMI`, amount: loan.emiAmount, dueDate: emiDate, type: loan.type === 'taken' ? 'loan_emi' : 'loan_emi_receive' });
      }
    }
  });

  upcomingDues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="space-y-6 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-24">
      {/* Greeting Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="w-14 h-14 rounded-full overflow-hidden bg-primary/20 border-2 border-background shadow-sm shrink-0 flex md:hidden items-center justify-center hover:opacity-80 transition-opacity">
            {session.user.image ? (
              <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{session.user.name?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Hello, {session.user.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Here is your financial overview for {getCurrentFormatted('MMMM YYYY')}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DashboardScanTrigger />
          <Link href="/my-upi" className={`${buttonVariants({ variant: "outline" })} flex-1 md:w-auto h-10 rounded-xl bg-background/50 border-border/50 shadow-sm hover:bg-secondary/50 hover:border-primary/30 transition-all text-foreground bg-card`}>
            <QrCode className="w-4 h-4 mr-2 text-primary" />
            <span className="font-medium text-foreground">My UPI</span>
          </Link>
        </div>
      </div>

      <PendingConfirmationsWidget />
      <UpcomingDuesWidget dues={upcomingDues} />

      {missingBudgets.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/20 p-2 rounded-lg text-destructive">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Budgets Expired</p>
              <p className="text-sm text-muted-foreground">You have {missingBudgets.length} categories without an active budget for this month. You cannot add expenses to these categories until a budget is set.</p>
            </div>
          </div>
          <Link href="/budgets" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-sm">
            Set Budgets
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1 md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Net Worth</CardTitle>
              <div className="text-2xl font-bold mt-1 text-foreground"><CurrencyDisplay amount={totalBalance} /></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 h-[65px] overflow-hidden px-2 relative -mx-2">
            <NetWorthChart data={nwHistory} />
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
            <div className="text-2xl font-bold text-foreground"><CurrencyDisplay amount={monthlyIncome} showSign={true} /></div>
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
            <div className="text-2xl font-bold text-foreground"><CurrencyDisplay amount={-monthlyExpense} /></div>
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
                <CurrencyDisplay amount={totalOweUs} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">To Pay</span>
                <CurrencyDisplay amount={totalWeOwe} className="text-sm font-semibold text-red-600 dark:text-red-400" />
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
              <div className="text-2xl font-bold text-foreground"><CurrencyDisplay amount={totalOutstanding} /></div>
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
                  <div className="flex items-center gap-4 min-w-0 flex-1">
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
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{t.categoryId?.name || t.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{formatDate(t.date, 'short', userTimezone)} • {t.accountId?.name || 'Account'}</p>
                    </div>
                  </div>
                  <CurrencyDisplay
                    amount={t.type === 'expense' || t.type === 'lend' ? -t.amount : t.amount}
                    className={`shrink-0 font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
                    showSign={t.type === 'income'}
                  />
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
