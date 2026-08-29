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
  CreditCard as CardIcon,
  AlertCircle,
  ArrowDownLeft,
  ArrowRightLeft,
  TrendingUp,
  Circle,
  Shield,
  Briefcase,
  QrCode
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/helpers";
import { isSameMonthAndYear, getCurrentDate, parseToDate } from "@/lib/dateTimeHelper";
import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";
import { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { UpcomingDuesWidget } from "@/components/dashboard/UpcomingDuesWidget";
import { ActionCenterWrapper } from "@/components/dashboard/ActionCenterWrapper";
import { DashboardAdvancedFilter } from "@/components/dashboard/DashboardAdvancedFilter";

function getFallbackTransactionIcon(type: string) {
  const className = "w-5 h-5 text-white";
  if (type === "income") return <ArrowDownLeft className={className} />;
  if (type === "expense") return <ArrowUpRight className={className} />;
  if (type === "transfer") return <ArrowRightLeft className={className} />;
  if (type === "lend" || type === "borrow") return <Users className={className} />;
  return <Circle className={className} />;
}

export default async function DashboardPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const searchParams = props.searchParams ? await props.searchParams : {};
  const daysParam = (searchParams.days as string) || "7";
  const isCustom = daysParam === "custom";
  const fromDateStr = searchParams.from as string;
  const toDateStr = searchParams.to as string;

  let daysFilter = 7;
  let customStartDate: Date | null = null;
  let customEndDate: Date | null = null;

  if (isCustom && fromDateStr && toDateStr) {
    customStartDate = new Date(fromDateStr);
    customEndDate = new Date(toDateStr);
    customEndDate.setHours(23, 59, 59, 999);
    daysFilter = Math.max(1, Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 3600 * 24)));
  } else {
    daysFilter = parseInt(daysParam, 10);
    if (isNaN(daysFilter)) daysFilter = 7;
  }

  const userTimezone = (session.user as any).timezone || "UTC";

  const [accounts, transactions, people, cards, investments, policies, loans, missingBudgets, nwHistory] = await Promise.all([
    getAccounts(),
    getTransactions(200), // Fetch enough for 7/15/30 days
    getPeople(),
    getCreditCards(),
    import("@/actions/investment").then(m => m.getInvestments()),
    import("@/actions/insurance").then(m => m.getInsurancePolicies()),
    import("@/actions/loan").then(m => m.getLoans()),
    getMissingBudgets(),
    getNetWorthHistory(daysFilter)
  ]);

  // Fire and forget net worth snapshot
  snapshotNetWorth().catch(console.error);

  const rates = await fetchExchangeRates();

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

  const totalDebtOwed = totalLoansTaken + totalCardOutstanding;

  const totalBalance = accounts.reduce((acc: number, curr: any) => {
    const rate = getConversionRate(curr.currency || "INR", rates);
    const baseBalance = curr.balance / rate;
    return curr.isLiability ? acc - baseBalance : acc + baseBalance;
  }, 0) - totalLoansTaken + totalLoansGiven + totalInvestmentValue - totalCardOutstanding;

  const sp = await props.searchParams;
  const rawMonths = typeof sp?.months === 'string' ? sp.months : (sp?.months?.[0] || undefined);
  const rawYears = typeof sp?.years === 'string' ? sp.years : (sp?.years?.[0] || undefined);
  const selectedMonths = rawMonths ? rawMonths.split(",").map(Number) : [];
  const selectedYears = rawYears ? rawYears.split(",").map(Number) : [];
  const isMonthYear = (sp?.days === "month_year") || (sp?.days?.[0] === "month_year");

  // Calculate timeframe-based income and expenses
  const now = getCurrentDate();
  let pastDate = new Date(now);
  let effectiveNow = new Date(now);

  if (isCustom && customStartDate && customEndDate) {
    pastDate = customStartDate;
    effectiveNow = customEndDate;
  } else if (!isMonthYear) {
    pastDate.setDate(now.getDate() - daysFilter);
  }

  const timeframeTxns = transactions.filter((t: any) => {
    // Only completed transactions should be counted towards period income/expenses
    if (t.status && t.status !== "completed") return false;

    const txDate = parseToDate(t.date);
    if (isMonthYear) {
      if (selectedYears.length > 0 && !selectedYears.includes(txDate.getFullYear())) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(txDate.getMonth())) return false;
      return true;
    }
    return txDate >= pastDate && txDate <= effectiveNow;
  });

  const timeframeIncome = timeframeTxns
    .filter((t: any) => t.type === "income")
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const timeframeExpense = timeframeTxns
    .filter((t: any) => t.type === "expense")
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  // Group expenses by category for donut chart
  const expenseByCategory: Record<string, { value: number; color: string }> = {};
  timeframeTxns.forEach((t: any) => {
    if (t.type === "expense" && t.categoryId) {
      const catName = t.categoryId.name;
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = { value: 0, color: t.categoryId.color || "#0ea5e9" };
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
  const nextXDays = getCurrentDate();
  nextXDays.setDate(now.getDate() + 365);

  // Parse credit cards
  cards.forEach((c: any) => {
    if (c.currentOutstanding > 0 && c.dueDate) {
      let dd = parseToDate(c.dueDate);
      if (dd.getMonth() < now.getMonth() && dd.getFullYear() <= now.getFullYear()) dd.setMonth(now.getMonth());
      if (dd <= nextXDays && dd >= now) {
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
      if (nextDue <= nextXDays && nextDue >= now) {
        upcomingDues.push({ title: `${inv.name} SIP`, amount: inv.investedAmount, dueDate: nextDue, type: 'sip' });
      }
    }
  });

  // Parse insurance policies
  policies.forEach((pol: any) => {
    if (pol.status === 'active' && pol.renewalDate) {
      let rd = parseToDate(pol.renewalDate);
      if (rd >= now && rd <= nextXDays) {
        upcomingDues.push({ title: `${pol.policyName} Premium`, amount: pol.premiumAmount, dueDate: rd, type: 'insurance' });
      }
    }
  });

  // Parse active loans (EMIs)
  activeLoans.forEach((loan: any) => {
    if (loan.status === 'active' && loan.emiDate && loan.emiAmount > 0) {
      let emiDate = parseToDate(`${now.getFullYear()}-${now.getMonth() + 1}-${loan.emiDate}`);
      if (emiDate < now) emiDate.setMonth(now.getMonth() + 1);
      if (emiDate <= nextXDays && emiDate >= now) {
        upcomingDues.push({ title: `${loan.name} EMI`, amount: loan.emiAmount, dueDate: emiDate, type: loan.type === 'taken' ? 'loan_emi' : 'loan_emi_receive' });
      }
    }
  });

  upcomingDues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Growth calculation (mocking a simple % for visual purposes if we don't have deep historical net worth, but since we have nwHistory we can use it)
  let nwGrowth = 0;
  if (nwHistory && nwHistory.length > 1) {
    const oldest = nwHistory[nwHistory.length - 1].netWorth;
    const newest = nwHistory[0].netWorth;
    if (oldest !== 0) {
      nwGrowth = ((newest - oldest) / Math.abs(oldest)) * 100;
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col md:relative md:block md:inset-auto md:h-auto overflow-hidden md:overflow-visible">
      {/* Static Header Container */}
      <div className="shrink-0 z-40 border-b md:border-none bg-card/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none px-4 md:px-6 lg:px-8 py-3 md:pt-6 lg:pt-8 shadow-sm md:shadow-none">
        <ActionCenterWrapper upcomingDues={upcomingDues} daysAhead={daysFilter} user={session.user} />
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar md:overflow-visible">
        <div className="space-y-8 px-4 md:px-6 lg:px-8 pt-4 pb-24 md:pb-8">



      {/* ZONE 2: MACRO OVERVIEW (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Worth */}
        <Link href="/accounts" className="block">
          <Card className="hover:shadow-md transition-all border-none bg-gradient-to-br from-card to-card shadow-sm cursor-pointer hover:-translate-y-1 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider sm:normal-case sm:tracking-normal">Total Net Worth</CardTitle>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-foreground"><CurrencyDisplay amount={totalBalance} /></div>
              <p className={`text-[10px] sm:text-xs mt-1 flex items-center gap-1 ${nwGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {nwGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(nwGrowth).toFixed(1)}% vs past {daysFilter} days
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Investments */}
        <Link href="/investments" className="block">
          <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="w-24 h-24 text-purple-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider sm:normal-case sm:tracking-normal">Total Investments</CardTitle>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-foreground"><CurrencyDisplay amount={totalInvestmentValue} /></div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Across SIPs & FDs</p>
            </CardContent>
          </Card>
        </Link>

        {/* Debt */}
        <Link href="/loans" className="block">
          <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm cursor-pointer hover:-translate-y-1 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertCircle className="w-24 h-24 text-red-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider sm:normal-case sm:tracking-normal">Total Debt</CardTitle>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-foreground"><CurrencyDisplay amount={totalDebtOwed} /></div>
              <p className="text-[10px] sm:text-xs text-red-500 mt-1 flex items-center gap-1">
                Cards & Loans
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Cashflow Summary */}
        <div className="block">
          <Card className="hover:shadow-md transition-all border-none bg-card shadow-sm h-full relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 relative z-10">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider sm:normal-case sm:tracking-normal">Period Cashflow</CardTitle>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 relative z-10 flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center"><ArrowDownLeft className="w-3 h-3 text-emerald-500 mr-1" /> IN</span>
                <CurrencyDisplay amount={timeframeIncome} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center"><ArrowUpRight className="w-3 h-3 text-red-500 mr-1" /> OUT</span>
                <CurrencyDisplay amount={timeframeExpense} className="text-sm font-semibold text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ZONE 3 & 4: CHARTS & ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Charts */}
        <Card className="lg:col-span-4 border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <OverviewChart data={chartData} />
            ) : (
              <div className="text-center py-20 text-muted-foreground">No expenses in this timeframe.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3 border-none shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
            <Link href="/transactions" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overflow-x-hidden max-h-[320px] px-4 custom-scrollbar">
            <div className="space-y-4">
              {transactions.filter((t: any) => !t.status || t.status === "completed").slice(0, 5).map((t: any) => (
                <div key={t._id} className="flex items-center justify-between group cursor-pointer hover:bg-secondary/40 p-2 rounded-lg transition-colors">
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
                    <div className="min-w-0 flex-1 pr-2">
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

      {/* Net Worth Chart Footer */}
      <Card className="border-none shadow-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Net Worth Trend ({daysFilter} Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <NetWorthChart data={nwHistory} />
        </CardContent>
      </Card>
    </div>
  </div>
</div>
  );
}
