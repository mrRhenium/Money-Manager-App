"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { Select as AntSelect } from "antd";
import { MasterSearchField } from "@/components/layout/MasterView";
import { Search, Repeat, CalendarDays, TrendingDown, LayoutList, ArrowUpDown } from "lucide-react";
import { RecurringBillForm } from "@/components/forms/RecurringBillForm";
import { RecurringBillList } from "@/components/lists/RecurringBillList";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";
import { getStartOfDay } from "@/lib/dateTimeHelper";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f43f5e'];

export function SubscriptionClient({ 
  initialBills, 
  accounts,
  categories
}: { 
  initialBills: any[];
  accounts: any[];
  categories: any[];
}) {
  const { format } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [listTab, setListTab] = useState(searchParams.get("status") || "1");
  const [frequencyFilter, setFrequencyFilter] = useState<string[]>(searchParams.get("freq") ? searchParams.get("freq")!.split(",") : []);
  const [autoPayFilter, setAutoPayFilter] = useState(searchParams.get("autopay") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date-nearest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (listTab !== "1") current.set("status", listTab);
    else current.delete("status");

    if (frequencyFilter.length > 0) current.set("freq", frequencyFilter.join(","));
    else current.delete("freq");

    if (autoPayFilter !== "all") current.set("autopay", autoPayFilter);
    else current.delete("autopay");

    if (sortBy !== "date-nearest") current.set("sort", sortBy);
    else current.delete("sort");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, listTab, frequencyFilter, autoPayFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || listTab !== "1" || frequencyFilter.length > 0 || autoPayFilter !== "all" || sortBy !== "date-nearest";

  const clearFilters = () => {
    setSearchQuery("");
    setListTab("1");
    setFrequencyFilter([]);
    setAutoPayFilter("all");
    setSortBy("date-nearest");
  };

  // Derived Data (KPIs)
  const filteredBills = useMemo(() => {
    let result = [...initialBills];

    if (frequencyFilter.length > 0) {
      result = result.filter(b => frequencyFilter.includes(b.frequency));
    }

    if (autoPayFilter !== "all") {
      result = result.filter(b => autoPayFilter === "yes" ? b.autoPay : !b.autoPay);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => (b.name || "").toLowerCase().includes(q));
    }

    return result;
  }, [initialBills, searchQuery, frequencyFilter, autoPayFilter]);

  const activeBills = filteredBills.filter(b => b.isActive);
  
  let totalMonthly = 0;
  let totalAnnual = 0;
  let upcomingRenewals = 0;

  const today = getStartOfDay().getTime();
  const nextWeek = today + 7 * 24 * 60 * 60 * 1000;

  // Chart data aggregation map
  const categoryMonthlyMap: Record<string, number> = {};

  activeBills.forEach(bill => {
    const amt = bill.amount || 0;
    let monthly = 0;
    let annual = 0;

    switch (bill.frequency) {
      case "weekly":
        monthly = amt * 4.33;
        annual = amt * 52;
        break;
      case "bi-weekly":
        monthly = amt * 2.16;
        annual = amt * 26;
        break;
      case "quarterly":
        monthly = amt / 3;
        annual = amt * 4;
        break;
      case "yearly":
        monthly = amt / 12;
        annual = amt;
        break;
      case "monthly":
      default:
        monthly = amt;
        annual = amt * 12;
        break;
    }

    totalMonthly += monthly;
    totalAnnual += annual;

    // Upcoming check
    const dueTime = new Date(bill.nextDueDate).getTime();
    if (dueTime >= today && dueTime <= nextWeek) {
      upcomingRenewals++;
    }

    // Chart Aggregation
    const catName = bill.categoryId?.name || "Uncategorized";
    categoryMonthlyMap[catName] = (categoryMonthlyMap[catName] || 0) + monthly;
  });

  const chartData = Object.keys(categoryMonthlyMap)
    .map(key => ({ name: key, value: categoryMonthlyMap[key] }))
    .sort((a, b) => b.value - a.value);

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search subscriptions..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Status</h3>
        <AntSelect
          value={listTab}
          onChange={setListTab}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Active", value: "1" },
            { label: "Paused", value: "2" },
            { label: "Overdue", value: "3" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Frequency</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Frequencies"
          value={frequencyFilter}
          onChange={setFrequencyFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Weekly", value: "weekly" },
            { label: "Bi-Weekly", value: "bi-weekly" },
            { label: "Monthly", value: "monthly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Yearly", value: "yearly" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Auto-Pay</h3>
        <AntSelect
          value={autoPayFilter}
          onChange={setAutoPayFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All", value: "all" },
            { label: "Enabled", value: "yes" },
            { label: "Disabled", value: "no" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Sort By</h3>
        <AntSelect
          value={sortBy}
          onChange={setSortBy}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "⏳ Due: Nearest First", value: "date-nearest" },
            { label: "📆 Due: Farthest First", value: "date-farthest" },
            { label: "💰 Amount: High to Low", value: "amount-high" },
            { label: "💵 Amount: Low to High", value: "amount-low" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Repeat className="w-6 h-6 text-primary" /> Subscriptions</>}
        subtitle="Manage your recurring bills and auto-pays."
        actions={<div className="sm:hidden"><RecurringBillForm accounts={accounts} categories={categories} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<RecurringBillForm accounts={accounts} categories={categories} triggerClassName="h-10 px-6 text-base font-semibold" />}
          />

          <MasterViewLayout
            sidebar={
              <MasterFilterSidebar 
                isFilterActive={isFilterActive} 
                onClearFilters={clearFilters}
              >
                {filterPanelContent}
              </MasterFilterSidebar>
            }
          >
            <TabsContent value="data" className="h-full m-0">
              <div className="pb-24">
                <RecurringBillList 
                  bills={filteredBills} 
                  accounts={accounts} 
                  categories={categories}
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalSort={sortBy}
                  externalTab={listTab}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <KPICard label="Active Subs" value={activeBills.length.toString()} icon={LayoutList} themeColor="indigo" />
                  <KPICard 
                    label="Monthly Cost" 
                    value={<CurrencyDisplay amount={totalMonthly} />} 
                    icon={TrendingDown} 
                    themeColor="destructive" 
                  />
                  <KPICard 
                    label="Annual Cost" 
                    value={<CurrencyDisplay amount={totalAnnual} />} 
                    icon={TrendingDown} 
                    themeColor="amber" 
                  />
                  <KPICard 
                    label="Due in 7 Days" 
                    value={upcomingRenewals.toString()} 
                    icon={CalendarDays} 
                    themeColor={upcomingRenewals > 0 ? "destructive" : "emerald"} 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="text-lg font-bold text-foreground">Monthly Cost Breakdown</h2>
                        <p className="text-sm text-muted-foreground mt-1">Subscription costs distributed by category (converted to monthly).</p>
                      </div>
                      <div className="p-4 sm:p-6 h-[400px]">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any) => format(Number(value))}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                              />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                            <Repeat className="w-8 h-8 mb-2 opacity-50" />
                            <p>No active subscriptions to chart.</p>
                          </div>
                        )}
                      </div>
                    </div>
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
