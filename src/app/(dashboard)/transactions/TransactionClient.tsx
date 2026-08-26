"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { Search, LayoutGrid, PieChartIcon, UploadCloud, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Select as AntSelect } from "antd";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { ExportButton } from "@/components/transactions/ExportButton";
import { MasterSearchField } from "@/components/layout/MasterView";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { parseToDate, formatDateString } from "@/lib/dateTimeHelper";

export function TransactionClient({
  initialTransactions,
  userTimezone,
  accounts,
  categories,
  people,
  creditCards
}: {
  initialTransactions: any[];
  userTimezone: string;
  accounts: any[];
  categories: any[];
  people: any[];
  creditCards: any[];
}) {
  const { format, formatCompact } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [categoryFilter, setCategoryFilter] = useState<string[]>(searchParams.get("category") ? searchParams.get("category")!.split(",") : []);
  const [accountFilter, setAccountFilter] = useState<string[]>(searchParams.get("account") ? searchParams.get("account")!.split(",") : []);
  const [personFilter, setPersonFilter] = useState<string[]>(searchParams.get("person") ? searchParams.get("person")!.split(",") : []);
  const [statusFilter, setStatusFilter] = useState<string[]>(searchParams.get("status") ? searchParams.get("status")!.split(",") : []);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");

    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");

    if (typeFilter !== "all") current.set("type", typeFilter);
    else current.delete("type");

    if (categoryFilter.length > 0) current.set("category", categoryFilter.join(","));
    else current.delete("category");

    if (accountFilter.length > 0) current.set("account", accountFilter.join(","));
    else current.delete("account");

    if (personFilter.length > 0) current.set("person", personFilter.join(","));
    else current.delete("person");

    if (statusFilter.length > 0) current.set("status", statusFilter.join(","));
    else current.delete("status");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, typeFilter, categoryFilter, accountFilter, pathname]);

  const isFilterActive = searchQuery !== "" || typeFilter !== "all" || categoryFilter.length > 0 || accountFilter.length > 0 || personFilter.length > 0 || statusFilter.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter([]);
    setAccountFilter([]);
    setPersonFilter([]);
    setStatusFilter([]);
  };

  // Filter transactions for KPI and Chart
  const filteredTransactions = useMemo(() => {
    let result = [...initialTransactions];

    if (typeFilter !== "all") result = result.filter(t => t.type === typeFilter);
    if (categoryFilter.length > 0) result = result.filter(t => t.categoryId && categoryFilter.includes(t.categoryId._id));
    if (accountFilter.length > 0) result = result.filter(t => (t.accountId && accountFilter.includes(t.accountId._id)) || (t.toAccountId && accountFilter.includes(t.toAccountId._id)));
    if (personFilter.length > 0) result = result.filter(t => t.personId && personFilter.includes(t.personId._id));
    if (statusFilter.length > 0) result = result.filter(t => statusFilter.includes(t.status || "cleared"));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => (t.note && t.note.toLowerCase().includes(q)) || (t.upiPayeeName && t.upiPayeeName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [initialTransactions, searchQuery, typeFilter, categoryFilter, accountFilter]);

  // KPIs
  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // Chart Data preparation
  const chartData = useMemo(() => {
    const dailyTotals: Record<string, { date: string, timestamp: number, income: number, expense: number }> = {};

    // Process all transactions for graph, ignoring current filters to show global trend, or you can use filteredTransactions. Let's use filteredTransactions for context-aware graphs.
    filteredTransactions.forEach(t => {
      const dateStr = formatDateString(t.date, "MMM DD");
      const timestamp = parseToDate(t.date).getTime();

      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = { date: dateStr, timestamp, income: 0, expense: 0 };
      }

      if (t.type === "income") dailyTotals[dateStr].income += t.amount;
      if (t.type === "expense") dailyTotals[dateStr].expense += t.amount;
    });

    return Object.values(dailyTotals)
      .sort((a, b) => a.timestamp - b.timestamp)
      // Only keep the last 30 days if it's too large, or just return all
      .slice(-30);
  }, [filteredTransactions, userTimezone]);

  const categoryOptions = categories.map(c => ({ label: c.name, value: c._id }));
  const accountOptions = accounts.map(a => ({ label: a.name, value: a._id }));
  const personOptions = people.map(p => ({ label: p.name, value: p._id }));

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search notes, payee..." />
      
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <AntSelect
          value={typeFilter}
          onChange={setTypeFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All Types", value: "all" },
            { label: "Income", value: "income" },
            { label: "Expense", value: "expense" },
            { label: "Transfer", value: "transfer" },
            { label: "Lend", value: "lend" },
            { label: "Borrow", value: "borrow" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Category</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Categories"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Account</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Accounts"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={accountFilter}
          onChange={setAccountFilter}
          options={accountOptions}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">People</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Parties/People"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={personFilter}
          onChange={setPersonFilter}
          options={personOptions}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Status</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Statuses"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Cleared", value: "cleared" },
            { label: "Pending", value: "pending" },
            { label: "Reconciled", value: "reconciled" },
            { label: "Failed", value: "failed" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader
        title={<><Wallet className="w-6 h-6 text-primary" /> Transactions</>}
        subtitle="Track all your incomes and expenses."
      />

      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full overflow-hidden">

          <MasterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={() => setMobileFilterOpen(true)}
            isFilterActive={isFilterActive}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { value: "data", label: "Data View", icon: <LayoutGrid className="w-4 h-4 mr-2" /> },
              { value: "insights", label: "Insights & Graphs", icon: <PieChartIcon className="w-4 h-4 mr-2" /> }
            ]}
            primaryAction={
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/import" className="hidden sm:block">
                  <Button variant="secondary" className="h-9 sm:h-10 px-4">
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </Link>
                <div className="hidden sm:block"><ExportButton /></div>
                <TransactionForm accounts={accounts} categories={categories} people={people} creditCards={creditCards} triggerClassName="h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base font-semibold" />
              </div>
            }
          />

          <MasterViewLayout
            sidebar={
              activeTab === "insights" ? (
                <div className="hidden md:block">
                  <MasterFilterSidebar
                    isFilterActive={isFilterActive}
                    onClearFilters={clearFilters}
                  >
                    {filterPanelContent}
                  </MasterFilterSidebar>
                </div>
              ) : undefined
            }
          >
            <TabsContent value="data" className="h-full m-0">
              <div className="pb-24 pt-2">
                <TransactionTable
                  transactions={initialTransactions}
                  userTimezone={userTimezone}
                  accounts={accounts}
                  categories={categories}
                  people={people}
                  creditCards={creditCards}
                  // We pass the filter state ONLY to the mobile view component inside TransactionTable
                  externalMobileSearch={searchQuery}
                  externalMobileType={typeFilter}
                  externalMobileCategory={categoryFilter}
                  externalMobileAccount={accountFilter}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 pt-2 space-y-6">

                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-3">
                  <KPICard
                    label="Total Income"
                    value={<CurrencyDisplay amount={totalIncome} />}
                    icon={ArrowDownRight}
                    themeColor="emerald"
                  />
                  <KPICard
                    label="Total Expenses"
                    value={<CurrencyDisplay amount={totalExpense} />}
                    icon={ArrowUpRight}
                    themeColor="destructive"
                  />
                  <KPICard
                    label="Net Cashflow"
                    value={<CurrencyDisplay amount={netCashflow} showSign />}
                    icon={Wallet}
                    themeColor={netCashflow >= 0 ? "indigo" : "amber"}
                    className="col-span-2 md:col-span-1"
                  />
                </div>

                {/* Graph Area */}
                <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                    <h2 className="text-lg font-bold text-foreground">Cashflow Trend</h2>
                    <p className="text-sm text-muted-foreground mt-1">Income vs expenses over the last 30 active days.</p>
                  </div>
                  <div className="p-4 sm:p-6 h-[400px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            tickFormatter={(value) => formatCompact(value)}
                            width={60}
                          />
                          <RechartsTooltip
                            formatter={(value: any) => format(Number(value))}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                        <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
                        <p>No transaction data available for the selected filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </MasterViewLayout>
        </Tabs>
      </div>

      <MasterFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        isFilterActive={isFilterActive}
        onClearFilters={clearFilters}
      >
        {filterPanelContent}
      </MasterFilterDrawer>
    </MasterLayout>
  );
}
