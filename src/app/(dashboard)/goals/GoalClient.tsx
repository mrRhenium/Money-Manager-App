"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout, MasterContent } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Select as AntSelect } from "antd";
import { Search, Target, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/forms/GoalForm";
import { GoalList } from "@/components/lists/GoalList";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export function GoalClient({ initialGoals, accounts }: { initialGoals: any[], accounts: any[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "active");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "deadline-nearest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams();
    if (activeTab !== "data") current.set("tab", activeTab);
    if (searchQuery) current.set("q", searchQuery);
    if (statusFilter !== "active") current.set("status", statusFilter);
    if (sortBy !== "deadline-nearest") current.set("sort", sortBy);

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, statusFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || statusFilter !== "active" || sortBy !== "deadline-nearest";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("active");
    setSortBy("deadline-nearest");
  };

  // Derived Data
  const filteredGoals = useMemo(() => {
    let result = [...initialGoals];

    if (statusFilter === "active") result = result.filter(g => g.status === "active");
    else if (statusFilter === "completed") result = result.filter(g => g.status === "completed");

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => (g.name || "").toLowerCase().includes(q));
    }

    return result; // We pass sorting down to GoalList or do it here. For now, GoalList expects arrays.
  }, [initialGoals, searchQuery, statusFilter]);

  const activeGoals = filteredGoals.filter(g => g.status === "active");
  const completedGoals = filteredGoals.filter(g => g.status === "completed");
  
  const totalTarget = activeGoals.reduce((sum: number, g: any) => sum + g.targetAmount, 0);
  const totalSaved = activeGoals.reduce((sum: number, g: any) => sum + g.currentAmount, 0);
  const percentSaved = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Filter Panel Component
  const filterPanelContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Search</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search goals..."
            className="w-full pl-9 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-card text-foreground px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Status</h3>
        <AntSelect
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
            { label: "All", value: "all" },
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
            { label: "🔥 Deadline: Nearest", value: "deadline-nearest" },
            { label: "🕐 Deadline: Farthest", value: "deadline-farthest" },
            { label: "📈 Progress: High to Low", value: "progress-high" },
            { label: "📉 Progress: Low to High", value: "progress-low" },
            { label: "💰 Target: High to Low", value: "amount-high" },
            { label: "💵 Target: Low to High", value: "amount-low" },
          ]}
        />
      </div>
    </div>
  );

  // Goal Progress Chart Data
  const chartData = activeGoals.map(g => ({
    name: g.name,
    Saved: g.currentAmount,
    Remaining: Math.max(0, g.targetAmount - g.currentAmount)
  })).sort((a, b) => (b.Saved + b.Remaining) - (a.Saved + a.Remaining)).slice(0, 8); // top 8 goals

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Target className="w-6 h-6 text-primary" /> Savings Goals</>}
        subtitle="Track your progress towards your financial targets."
        actions={<div className="sm:hidden"><GoalForm triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<GoalForm triggerClassName="h-10 px-6 text-base font-semibold" />}
          />

          <MasterViewLayout
            sidebar={
              <MasterFilterSidebar isFilterActive={isFilterActive} onClearFilters={clearFilters}>
                {filterPanelContent}
              </MasterFilterSidebar>
            }
          >
            <TabsContent value="data" className="outline-none !mt-0 h-full">
              {filteredGoals.length > 0 ? (
                <GoalList activeGoals={filteredGoals} completedGoals={[]} accounts={accounts} externalSort={sortBy} hideToolbar />
              ) : (
                <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Goals Match Filters</h3>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="outline-none !mt-0 space-y-6">
              {/* KPI Cards Section */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <KPICard label="Active Goals" value={activeGoals.length} icon={Target} themeColor="primary" />
                <KPICard label="Completed Goals" value={completedGoals.length} icon={CheckCircle2} themeColor="emerald" />
                <KPICard label="Total Saved" value={<CurrencyDisplay amount={totalSaved} />} icon={Wallet} themeColor="indigo" />
                <KPICard 
                  label="Total Target" 
                  value={<CurrencyDisplay amount={totalTarget} />} 
                  icon={TrendingUp} 
                  themeColor="amber" 
                  trend={<span className="text-sm font-medium opacity-80 inline-block text-amber-500">({percentSaved.toFixed(1)}% funded)</span>}
                />
              </div>

              {/* Goal Progress Chart */}
              <div className="bg-card border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-foreground">Goal Progress (Top 8)</h3>
                <div className="h-[350px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.7 }}
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'currentColor', opacity: 0.05 }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Saved" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={50} />
                        <Bar dataKey="Remaining" stackId="a" fill="#3b82f6" fillOpacity={0.2} radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No active goals to display</div>
                  )}
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
