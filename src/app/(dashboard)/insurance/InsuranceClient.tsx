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
import { Search, Shield, Activity, ShieldAlert, CalendarDays } from "lucide-react";
import { InsuranceForm } from "@/components/forms/InsuranceForm";
import { InsuranceTable } from "@/components/tables/InsuranceTable";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";
import { getStartOfDay } from "@/lib/dateTimeHelper";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function InsuranceClient({ 
  initialPolicies, 
  accounts
}: { 
  initialPolicies: any[];
  accounts: any[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (filterType !== "all") current.set("type", filterType);
    else current.delete("type");

    if (sortBy !== "newest") current.set("sort", sortBy);
    else current.delete("sort");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, filterType, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || filterType !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSortBy("newest");
  };

  // Derived Data (KPIs)
  const activePolicies = initialPolicies.filter((p: any) => p.status !== 'mistake');
  const totalCoverage = activePolicies.reduce((sum: number, p: any) => sum + (p.coverageAmount || 0), 0);
  const totalPremium = activePolicies.reduce((sum: number, p: any) => sum + (p.premiumAmount || 0), 0);

  let upcomingRenewals = 0;
  const today = getStartOfDay().getTime();
  const nextMonth = today + 30 * 24 * 60 * 60 * 1000;

  // Chart data aggregation map
  const typePremiumMap: Record<string, number> = {};

  activePolicies.forEach(policy => {
    const premium = policy.premiumAmount || 0;
    
    // Upcoming check
    if (policy.renewalDate) {
      const dueTime = new Date(policy.renewalDate).getTime();
      if (dueTime >= today && dueTime <= nextMonth) {
        upcomingRenewals++;
      }
    }

    // Chart Aggregation
    const pType = policy.type || "Other";
    typePremiumMap[pType] = (typePremiumMap[pType] || 0) + premium;
  });

  const chartData = Object.keys(typePremiumMap)
    .map(key => ({ name: key, value: typePremiumMap[key] }))
    .sort((a, b) => b.value - a.value);

  const filterPanelContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Search</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search policies..."
            className="w-full pl-9 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-card text-foreground px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <AntSelect
          value={filterType}
          onChange={setFilterType}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All Types", value: "all" },
            { label: "Life", value: "Life" },
            { label: "Health", value: "Health" },
            { label: "Vehicle", value: "Vehicle" },
            { label: "Home", value: "Home" },
            { label: "Travel", value: "Travel" },
            { label: "Other", value: "Other" },
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
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
            { label: "Highest Coverage", value: "highest_coverage" },
            { label: "Highest Premium", value: "highest_premium" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Shield className="w-6 h-6 text-primary" /> Insurance</>}
        subtitle="Manage your life, health, and general insurance policies."
        actions={<div className="sm:hidden"><InsuranceForm accounts={accounts} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<InsuranceForm accounts={accounts} triggerClassName="h-10 px-6 text-base font-semibold" />}
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
                <InsuranceTable 
                  policies={initialPolicies} 
                  accounts={accounts} 
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalSort={sortBy}
                  externalType={filterType}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <KPICard label="Total Policies" value={activePolicies.length.toString()} icon={Shield} themeColor="indigo" />
                  <KPICard 
                    label="Total Premium" 
                    value={<CurrencyDisplay amount={totalPremium} />} 
                    icon={ShieldAlert} 
                    themeColor="amber" 
                  />
                  <KPICard 
                    label="Total Coverage" 
                    value={<CurrencyDisplay amount={totalCoverage} />} 
                    icon={Activity} 
                    themeColor="emerald" 
                  />
                  <KPICard 
                    label="Renewals (30 Days)" 
                    value={upcomingRenewals.toString()} 
                    icon={CalendarDays} 
                    themeColor={upcomingRenewals > 0 ? "destructive" : "default"} 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="text-lg font-bold text-foreground">Premium by Type</h2>
                        <p className="text-sm text-muted-foreground mt-1">Distribution of your insurance premiums across different policy types.</p>
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
                                formatter={(value: any) => `₹${formatIndianNumber(value.toString())}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                              />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                            <Shield className="w-8 h-8 mb-2 opacity-50" />
                            <p>No active policies to chart.</p>
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
