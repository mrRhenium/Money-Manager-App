"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Select as AntSelect } from "antd";
import { MasterSearchField } from "@/components/layout/MasterView";
import { Search, PieChart as PieChartIcon, Target, TrendingUp, TrendingDown, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { BudgetList } from "@/components/lists/BudgetList";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";
import dayjs from "dayjs";

export function BudgetClient({ 
  initialBudgets, 
  categories,
  initialMonth,
  initialMode,
  initialStartDate,
  initialEndDate
}: { 
  initialBudgets: any[];
  categories: any[];
  initialMonth: string;
  initialMode: string;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "spent-high");
  const [statusFilter, setStatusFilter] = useState<string[]>(searchParams.get("status") ? searchParams.get("status")!.split(",") : []);
  const [rolloverFilter, setRolloverFilter] = useState(searchParams.get("rollover") || "all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Time params are handled by BudgetList, we just read them from props/url but for syncing other states:
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (sortBy !== "spent-high") current.set("sort", sortBy);
    else current.delete("sort");

    if (statusFilter.length > 0) current.set("status", statusFilter.join(","));
    else current.delete("status");

    if (rolloverFilter !== "all") current.set("rollover", rolloverFilter);
    else current.delete("rollover");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || sortBy !== "spent-high" || statusFilter.length > 0 || rolloverFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("spent-high");
    setStatusFilter([]);
    setRolloverFilter("all");
  };

  // Derived Data
  const filteredBudgets = useMemo(() => {
    let result = [...initialBudgets];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => (b.categoryId?.name || "").toLowerCase().includes(q));
    }

    if (statusFilter.length > 0) {
      result = result.filter(b => {
        const utilization = b.amount > 0 ? (b.totalSpent || 0) / b.amount : 0;
        if (statusFilter.includes("under") && utilization < 0.8) return true;
        if (statusFilter.includes("track") && utilization >= 0.8 && utilization < 1) return true;
        if (statusFilter.includes("exhausted") && utilization >= 1) return true;
        return false;
      });
    }

    if (rolloverFilter !== "all") {
      result = result.filter(b => rolloverFilter === "yes" ? b.rollover : !b.rollover);
    }

    if (sortBy === "spent-high") {
      result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (sortBy === "spent-low") {
      result.sort((a, b) => (a.totalSpent || 0) - (b.totalSpent || 0));
    } else if (sortBy === "budget-high") {
      result.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    }

    return result;
  }, [initialBudgets, searchQuery, sortBy]);
  
  const totalBudgeted = filteredBudgets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const totalSpent = filteredBudgets.reduce((sum: number, b: any) => sum + (b.totalSpent || 0), 0);
  const remainingBudget = totalBudgeted - totalSpent;
  const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  
  const chartData = filteredBudgets
    .map(b => ({
      name: b.categoryId?.name || "Unknown",
      Budget: b.amount || 0,
      Spent: b.totalSpent || 0,
      utilization: b.amount > 0 ? ((b.totalSpent || 0) / b.amount) * 100 : 0,
    }))
    .sort((a, b) => b.Budget - a.Budget)
    .slice(0, 10); // Top 10 by budget size

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search categories..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Budget Status</h3>
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
            { label: "Under Budget (< 80%)", value: "under" },
            { label: "On Track (80-100%)", value: "track" },
            { label: "Exhausted (>= 100%)", value: "exhausted" },
          ]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Rollover Policy</h3>
        <AntSelect
          value={rolloverFilter}
          onChange={setRolloverFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All Budgets", value: "all" },
            { label: "Rollover Enabled", value: "yes" },
            { label: "Rollover Disabled", value: "no" },
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
            { label: "🔥 Highest Spent", value: "spent-high" },
            { label: "🧊 Lowest Spent", value: "spent-low" },
            { label: "💎 Largest Budget", value: "budget-high" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><PieChartIcon className="w-6 h-6 text-primary" /> Budgets</>}
        subtitle="Manage your spending limits."
        actions={<div className="sm:hidden"><BudgetForm categories={categories} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<BudgetForm categories={categories} triggerClassName="h-10 px-6 text-base font-semibold" />}
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
                <BudgetList 
                  budgets={filteredBudgets} 
                  categories={categories}
                  selectedMonth={initialMonth}
                  mode={initialMode}
                  startDate={initialStartDate}
                  endDate={initialEndDate}
                  hideToolbar={true}
                  externalSort={sortBy}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <KPICard label="Total Budgeted" value={<CurrencyDisplay amount={totalBudgeted} />} icon={Target} themeColor="indigo" />
                  <KPICard label="Total Spent" value={<CurrencyDisplay amount={totalSpent} />} icon={TrendingDown} themeColor="destructive" />
                  <KPICard 
                    label="Remaining" 
                    value={<CurrencyDisplay amount={remainingBudget} />} 
                    icon={remainingBudget >= 0 ? TrendingUp : TrendingDown} 
                    themeColor={remainingBudget >= 0 ? "emerald" : "destructive"} 
                  />
                  <KPICard 
                    label="Utilization" 
                    value={`${overallUtilization.toFixed(1)}%`} 
                    icon={PieChartIcon} 
                    themeColor={overallUtilization > 100 ? "destructive" : overallUtilization > 80 ? "amber" : "emerald"} 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="text-lg font-bold text-foreground">Top 10 Budgets vs Spent</h2>
                        <p className="text-sm text-muted-foreground mt-1">Comparison of allocated budgets and actual expenditures.</p>
                      </div>
                      <div className="p-4 sm:p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                              axisLine={false} 
                              tickLine={false} 
                              dy={10} 
                            />
                            <YAxis 
                              tickFormatter={(val: number) => `₹${formatIndianNumber(val.toString())}`}
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                              axisLine={false} 
                              tickLine={false} 
                              dx={-10}
                            />
                            <Tooltip 
                              formatter={(value: any) => `₹${formatIndianNumber(value.toString())}`}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                              itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
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
