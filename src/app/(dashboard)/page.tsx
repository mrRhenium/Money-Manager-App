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
import { KPICard } from "@/components/dashboard/KPICard";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY } from "@/lib/designTokens";

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
    const [sYear, sMonth, sDay] = fromDateStr.split("-").map(Number);
    customStartDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0); // 12:00 AM
    const [eYear, eMonth, eDay] = toDateStr.split("-").map(Number);
    customEndDate = new Date(eYear, eMonth - 1, eDay + 1, 0, 0, 0, 0); // 12:00 AM
    daysFilter = Math.max(1, Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 3600 * 24)));
  } else {
    daysFilter = parseInt(daysParam, 10);
    if (isNaN(daysFilter)) daysFilter = 7;
  }

  const userTimezone = (session.user as any).timezone || "UTC";

  const [accounts, transactions, people, cards, investments, policies, loans, missingBudgets, nwHistory, recurringBills] = await Promise.all([
    getAccounts(),
    getTransactions(200), // Fetch enough for 7/15/30 days
    getPeople(),
    getCreditCards(),
    import("@/actions/investment").then(m => m.getInvestments()).catch(() => []),
    import("@/actions/insurance").then(m => m.getInsurancePolicies()).catch(() => []),
    import("@/actions/loan").then(m => m.getLoans()).catch(() => []),
    getMissingBudgets(),
    getNetWorthHistory(daysFilter),
    import("@/actions/recurringBill").then(m => m.getRecurringBills()).catch(() => [])
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
    pastDate = new Date(now);
    pastDate.setDate(now.getDate() - daysFilter);
    pastDate.setHours(0, 0, 0, 0); // 12:00 AM
    effectiveNow = new Date(now);
    effectiveNow.setHours(23, 59, 59, 999);
  }

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let filterSummary = "Last 7 Days";
  let isFilterActive = false;

  if (isCustom && fromDateStr && toDateStr) {
    const [sy, sm, sd] = fromDateStr.split("-");
    const [ey, em, ed] = toDateStr.split("-");
    filterSummary = `${sd}-${sm}-${sy} – ${ed}-${em}-${ey}`;
    isFilterActive = true;
  } else if (isMonthYear) {
    if (selectedMonths.length > 0 && selectedYears.length > 0) {
      const monthStr = selectedMonths.map(m => MONTH_NAMES[m] || m).join(", ");
      const yearStr = selectedYears.join(", ");
      filterSummary = `${monthStr} ${yearStr}`;
    } else if (selectedYears.length > 0) {
      filterSummary = selectedYears.join(", ");
    } else {
      filterSummary = "By Month/Year";
    }
    isFilterActive = true;
  } else if (daysParam === "15") {
    filterSummary = "Last 15 Days";
    isFilterActive = true;
  } else if (daysParam === "30") {
    filterSummary = "Last 30 Days";
    isFilterActive = true;
  } else if (daysParam === "90") {
    filterSummary = "Last 3 Months";
    isFilterActive = true;
  } else if (daysParam === "180") {
    filterSummary = "Last 6 Months";
    isFilterActive = true;
  } else if (daysParam && daysParam !== "7") {
    filterSummary = `Last ${daysParam} Days`;
    isFilterActive = true;
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
  nextXDays.setDate(now.getDate() + Math.max(30, daysFilter));

  // Parse credit cards
  cards.forEach((c: any) => {
    if (c.currentOutstanding > 0 && c.dueDate) {
      let dd = parseToDate(c.dueDate);
      if (dd.getMonth() < now.getMonth() && dd.getFullYear() <= now.getFullYear()) dd.setMonth(now.getMonth());
      if (dd <= nextXDays && dd >= now) {
        upcomingDues.push({
          title: `${c.bankName || 'Credit Card'}${c.last4Digits ? ` (*${c.last4Digits})` : ''} Bill`,
          amount: c.currentOutstanding,
          dueDate: dd,
          type: 'credit_card',
          entityId: c._id?.toString(),
          linkedAccountId: c.linkedAccountId?.toString(),
          bankName: c.bankName,
          last4Digits: c.last4Digits,
          icon: "CreditCard",
          color: c.color || "#3b82f6",
        });
      }
    }
  });

  // Parse investments (SIPs)
  investments.forEach((inv: any) => {
    if (inv.status === 'active' && inv.frequency === 'Monthly' && inv.startDate) {
      let nextDue: Date;
      if (inv.nextDueDate) {
        nextDue = parseToDate(inv.nextDueDate);
      } else {
        nextDue = parseToDate(inv.startDate);
        nextDue.setMonth(now.getMonth());
        nextDue.setFullYear(now.getFullYear());
        if (nextDue < now) nextDue.setMonth(now.getMonth() + 1);

        if (inv.lastPaidDate) {
          const lp = parseToDate(inv.lastPaidDate);
          if (lp.getMonth() === now.getMonth() && lp.getFullYear() === now.getFullYear()) {
            nextDue.setMonth(nextDue.getMonth() + 1);
          }
        }
      }

      if (nextDue <= nextXDays && nextDue >= now) {
        upcomingDues.push({
          title: `${inv.name} SIP`,
          amount: inv.investedAmount,
          dueDate: nextDue,
          type: 'sip',
          entityId: inv._id?.toString(),
          linkedAccountId: inv.linkedAccountId?.toString(),
          icon: inv.icon || "TrendingUp",
          color: inv.color || "#8b5cf6",
        });
      }
    }
  });

  // Parse insurance policies
  policies.forEach((pol: any) => {
    if (pol.status === 'active' && pol.renewalDate) {
      let rd = parseToDate(pol.renewalDate);
      if (rd >= now && rd <= nextXDays) {
        upcomingDues.push({
          title: `${pol.policyName} Premium`,
          amount: pol.premiumAmount,
          dueDate: rd,
          type: 'insurance',
          entityId: pol._id?.toString(),
          linkedAccountId: pol.linkedAccountId?.toString(),
          icon: pol.icon || "Shield",
          color: pol.color || "#10b981",
        });
      }
    }
  });

  // Parse active loans (EMIs)
  activeLoans.forEach((loan: any) => {
    if (loan.status === 'active' && loan.emiDate && loan.emiAmount > 0) {
      let emiDate: Date;
      if (loan.nextDueDate) {
        emiDate = parseToDate(loan.nextDueDate);
      } else {
        emiDate = parseToDate(`${now.getFullYear()}-${now.getMonth() + 1}-${loan.emiDate}`);
        if (emiDate < now) emiDate.setMonth(now.getMonth() + 1);

        // Check if an EMI has been paid for this loan in the last 28 days
        const recentEmiTx = transactions.find((t: any) =>
          (t.loanId?.toString() === loan._id?.toString() || t.loanId === loan._id?.toString()) &&
          (!t.status || t.status === "completed")
        );
        if (recentEmiTx) {
          const txDate = parseToDate(recentEmiTx.date || recentEmiTx.createdAt);
          const daysAgo = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
          if (daysAgo >= 0 && daysAgo < 28) {
            emiDate.setMonth(emiDate.getMonth() + 1);
          }
        }
      }

      if (emiDate <= nextXDays && emiDate >= now) {
        upcomingDues.push({
          title: `${loan.name} EMI`,
          amount: loan.emiAmount,
          dueDate: emiDate,
          type: loan.type === 'taken' ? 'loan_emi' : 'loan_emi_receive',
          entityId: loan._id?.toString(),
          linkedAccountId: loan.linkedAccountId?.toString(),
          icon: loan.icon || "Landmark",
          color: loan.color || "#f59e0b",
        });
      }
    }
  });

  // Parse recurring bills / subscriptions
  (recurringBills || []).forEach((b: any) => {
    if (b.isActive !== false && b.nextDueDate) {
      let nd = parseToDate(b.nextDueDate);
      if (nd <= nextXDays && nd >= now) {
        upcomingDues.push({
          title: `${b.name} Subscription`,
          amount: b.amount,
          dueDate: nd,
          type: 'subscription',
          entityId: b._id?.toString(),
          linkedAccountId: b.accountId?._id ? b.accountId._id.toString() : (b.accountId ? b.accountId.toString() : undefined),
          icon: b.icon || "Repeat",
          color: b.color || "#6366f1",
        });
      }
    }
  });

  upcomingDues.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  upcomingDues.forEach((d: any) => {
    const dueMidnight = new Date(d.dueDate.getFullYear(), d.dueDate.getMonth(), d.dueDate.getDate());
    d.daysRemaining = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 3600 * 24));
  });

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
    <div className="absolute inset-0 flex flex-col lg:relative lg:block lg:inset-auto lg:h-auto overflow-hidden lg:overflow-visible">
      {/* Static Header Container */}
      <div className="shrink-0 z-40 border-b lg:border-none bg-card/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none px-4 lg:px-8 py-3 lg:pt-8 shadow-sm lg:shadow-none">
        <ActionCenterWrapper 
          upcomingDues={upcomingDues} 
          daysAhead={daysFilter} 
          user={session.user} 
          accounts={accounts}
          filterSummary={filterSummary}
          isFilterActive={isFilterActive}
        />
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar lg:overflow-visible">
        <div className="space-y-8 px-4 lg:px-8 pt-4 pb-24 lg:pb-8">



      {/* ZONE 2: MACRO OVERVIEW (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Worth */}
        <Link href="/accounts" className="block h-full">
          <KPICard 
            label="Total Net Worth"
            value={<CurrencyDisplay amount={totalBalance} />}
            icon={Wallet}
            themeColor="primary"
            trend={
              <p className={`text-[10px] sm:text-xs flex items-center gap-1 font-medium ${nwGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {nwGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(nwGrowth).toFixed(1)}% vs past {daysFilter} days
              </p>
            }
            className="h-full hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          />
        </Link>

        {/* Investments */}
        <Link href="/investments" className="block h-full">
          <KPICard 
            label="Total Investments"
            value={<CurrencyDisplay amount={totalInvestmentValue} />}
            icon={Briefcase}
            themeColor="purple"
            trend={<span className="text-[10px] sm:text-xs text-muted-foreground">Across SIPs & FDs</span>}
            className="h-full hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          />
        </Link>

        {/* Debt */}
        <Link href="/loans" className="block h-full">
          <KPICard 
            label="Total Debt"
            value={<CurrencyDisplay amount={totalDebtOwed} />}
            icon={AlertCircle}
            themeColor="destructive"
            trend={<span className="text-[10px] sm:text-xs text-red-500 font-medium">Cards & Loans</span>}
            className="h-full hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          />
        </Link>

        {/* Cashflow Summary */}
        <div className="block h-full">
          <KPICard 
            label="Period Cashflow"
            value={
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 mr-1 shrink-0" /> IN
                  </span>
                  <CurrencyDisplay amount={timeframeIncome} className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tracking-tight" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-red-500 mr-1 shrink-0" /> OUT
                  </span>
                  <CurrencyDisplay amount={timeframeExpense} className="font-bold text-sm sm:text-base text-red-600 dark:text-red-400 tracking-tight" />
                </div>
              </div>
            }
            icon={Activity}
            themeColor="emerald"
            className="h-full hover:shadow-md"
          />
        </div>
      </div>

      {/* ZONE 3 & 4: CHARTS & ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Charts */}
        <Card className="lg:col-span-4 border-none shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div className="min-w-0">
              <CardTitle className={cn(TYPOGRAPHY.sectionTitle)}>Spending by Category</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expenses for <span className="font-semibold text-foreground">{filterSummary}</span>
              </p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/50 shrink-0">
              {filterSummary}
            </span>
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
            <CardTitle className={cn(TYPOGRAPHY.sectionTitle)}>Recent Activity</CardTitle>
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
                      <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {t.note || t.categoryId?.name || t.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {t.categoryId?.name && t.note ? `${t.categoryId.name} • ` : ""}
                        {formatDate(t.date, 'short', userTimezone)} • {t.accountId?.name || 'Account'}
                      </p>
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
          <CardTitle className={cn(TYPOGRAPHY.sectionTitle)}>Net Worth Trend ({daysFilter} Days)</CardTitle>
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
