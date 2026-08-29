"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { Select as AntSelect } from "antd";
import { MasterSearchField } from "@/components/layout/MasterView";
import { Search, TrendingUp, Wallet, PieChart as PieChartIcon, RefreshCw, BarChart2 } from "lucide-react";
import { InvestmentForm } from "@/components/forms/InvestmentForm";
import { InvestmentList } from "@/components/lists/InvestmentList";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { usePathname, useSearchParams } from "next/navigation";
import { parseToDate } from "@/lib/dateTimeHelper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function InvestmentClient({ initialInvestments, accounts }: { initialInvestments: any[], accounts: any[] }) {
  const { format } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState<string[]>(searchParams.get("status") ? searchParams.get("status")!.split(",") : ["active"]);
  const [typeFilters, setTypeFilters] = useState<string[]>(searchParams.get("types") ? searchParams.get("types")!.split(",") : []);
  const [returnFilter, setReturnFilter] = useState<string[]>(searchParams.get("returns") ? searchParams.get("returns")!.split(",") : []);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (statusFilter.length > 0 && !(statusFilter.length === 1 && statusFilter[0] === "active")) {
      current.set("status", statusFilter.join(","));
    } else if (statusFilter.length === 1 && statusFilter[0] === "active") {
      current.delete("status");
    }

    if (typeFilters.length > 0) current.set("types", typeFilters.join(","));
    else current.delete("types");

    if (returnFilter.length > 0) current.set("returns", returnFilter.join(","));
    else current.delete("returns");

    if (sortBy !== "newest") current.set("sort", sortBy);
    else current.delete("sort");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, statusFilter, typeFilters, returnFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || (statusFilter.length > 0 && !(statusFilter.length === 1 && statusFilter[0] === "active")) || typeFilters.length > 0 || returnFilter.length > 0 || sortBy !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(["active"]);
    setTypeFilters([]);
    setReturnFilter([]);
    setSortBy("newest");
  };

  const filteredInvestments = useMemo(() => {
    let result = [...initialInvestments];

    if (statusFilter.length > 0) {
      result = result.filter(i => statusFilter.includes(i.status));
    }

    if (typeFilters.length > 0) {
      result = result.filter(i => typeFilters.includes(i.investmentType));
    }

    if (returnFilter.length > 0) {
      result = result.filter(i => {
        const diff = (i.currentValue || 0) - (i.investedAmount || 0);
        if (returnFilter.includes("profit") && diff > 0) return true;
        if (returnFilter.includes("loss") && diff < 0) return true;
        if (returnFilter.includes("breakeven") && diff === 0) return true;
        return false;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => (i.name || "").toLowerCase().includes(q) || (i.ticker || "").toLowerCase().includes(q));
    }

    return result;
  }, [initialInvestments, searchQuery, statusFilter, typeFilters, returnFilter]);

  // KPIs
  const activeInvestments = filteredInvestments.filter(i => i.status === "active");
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
  const currentTotal = activeInvestments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
  const totalReturns = currentTotal - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const latestSync = initialInvestments
    .map((i: any) => i.lastAutoUpdatedAt ? parseToDate(i.lastAutoUpdatedAt).getTime() : 0)
    .sort((a: number, b: number) => b - a)[0];

  // Chart
  const categories: Record<string, { invested: number, current: number }> = {};
  activeInvestments.forEach(inv => {
    const type = inv.investmentType || "Other";
    if (!categories[type]) categories[type] = { invested: 0, current: 0 };
    categories[type].invested += (inv.investedAmount || 0);
    categories[type].current += (inv.currentValue || 0);
  });

  const chartData = Object.entries(categories).map(([name, data]) => ({
    name,
    value: data.current
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#6366f1', '#14b8a6'];
  const typeOptions = Array.from(new Set(initialInvestments.map(i => i.investmentType))).map(type => ({ label: type as string, value: type as string }));

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Name, ticker..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Status</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Active", value: "active" },
            { label: "Closed/Sold", value: "closed" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Asset Type</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Types"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={typeFilters}
          onChange={setTypeFilters}
          options={typeOptions}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Return Performance</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any Performance"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={returnFilter}
          onChange={setReturnFilter}
          options={[
            { label: "Profit 🟢", value: "profit" },
            { label: "Loss 🔴", value: "loss" },
            { label: "Break-even ⚪", value: "breakeven" },
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
            { label: "✨ Newest First", value: "newest" },
            { label: "🕒 Oldest First", value: "oldest" },
            { label: "📈 Highest Value", value: "highest_value" },
            { label: "📉 Lowest Value", value: "lowest_value" },
            { label: "🚀 Highest Return", value: "highest_return" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><TrendingUp className="w-6 h-6 text-primary" /> Investments</>}
        subtitle={
          <div className="flex items-center gap-2">
            Track your wealth growth across all asset classes.
            {latestSync > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border">
                <RefreshCw className="w-2.5 h-2.5" /> Synced {dayjs(latestSync).fromNow()}
              </span>
            )}
          </div>
        }
        actions={<div className="sm:hidden"><InvestmentForm accounts={accounts} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<InvestmentForm accounts={accounts} triggerClassName="h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base font-semibold" />}
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
                <InvestmentList
                  investments={filteredInvestments}
                  accounts={accounts}
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalSort={sortBy}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <KPICard 
                    label="Current Value" 
                    value={<CurrencyDisplay amount={currentTotal} />} 
                    icon={PieChartIcon} 
                    themeColor="indigo" 
                  />
                  <KPICard 
                    label="Total Invested" 
                    value={<CurrencyDisplay amount={totalInvested} />} 
                    icon={Wallet} 
                    themeColor="primary" 
                  />
                  <KPICard 
                    label="Total Returns" 
                    value={<CurrencyDisplay amount={totalReturns} showSign />} 
                    icon={TrendingUp} 
                    themeColor={totalReturns >= 0 ? "emerald" : "destructive"} 
                    trend={
                      <div className={`text-xs font-medium flex items-center gap-1 ${totalReturns >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {totalReturns >= 0 ? '+' : ''}{returnsPercentage.toFixed(2)}%
                      </div>
                    }
                  />
                  <KPICard 
                    label="Active Assets" 
                    value={activeInvestments.length.toString()} 
                    icon={BarChart2} 
                    themeColor="amber" 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="text-lg font-bold text-foreground">Asset Allocation</h2>
                        <p className="text-sm text-muted-foreground mt-1">Current value distribution across investment types.</p>
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
                                stroke="none"
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
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                            <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
                            <p>No investment data available.</p>
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
