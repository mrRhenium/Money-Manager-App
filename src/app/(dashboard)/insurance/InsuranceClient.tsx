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
  const { format } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [typeFilters, setTypeFilters] = useState<string[]>(searchParams.get("types") ? searchParams.get("types")!.split(",") : []);
  const [renewalFilter, setRenewalFilter] = useState<string[]>(searchParams.get("renewal") ? searchParams.get("renewal")!.split(",") : []);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (typeFilters.length > 0) current.set("types", typeFilters.join(","));
    else current.delete("types");

    if (renewalFilter.length > 0) current.set("renewal", renewalFilter.join(","));
    else current.delete("renewal");

    if (sortBy !== "newest") current.set("sort", sortBy);
    else current.delete("sort");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, typeFilters, renewalFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || typeFilters.length > 0 || renewalFilter.length > 0 || sortBy !== "newest";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilters([]);
    setRenewalFilter([]);
    setSortBy("newest");
  };

  // Derived Data (KPIs)
  const filteredPolicies = useMemo(() => {
    let result = [...initialPolicies];
    
    result = result.filter((p: any) => p.status !== 'mistake');

    if (typeFilters.length > 0) {
      result = result.filter((p: any) => typeFilters.includes(p.type));
    }

    if (renewalFilter.length > 0) {
      const now = new Date();
      result = result.filter((p: any) => {
        if (!p.renewalDate) return false;
        const renewalDate = new Date(p.renewalDate);
        const days = (renewalDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (renewalFilter.includes("overdue") && days < 0) return true;
        if (renewalFilter.includes("upcoming") && days >= 0 && days <= 30) return true;
        if (renewalFilter.includes("future") && days > 30) return true;
        return false;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) => 
        (p.provider || "").toLowerCase().includes(q) || 
        (p.policyNumber || "").toLowerCase().includes(q) ||
        (p.name || "").toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [initialPolicies, searchQuery, typeFilters, renewalFilter]);

  const activePolicies = filteredPolicies;
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
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search policies..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Types"
          value={typeFilters}
          onChange={setTypeFilters}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
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
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Renewal Timeline</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any Timeline"
          value={renewalFilter}
          onChange={setRenewalFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Overdue", value: "overdue" },
            { label: "Upcoming (Next 30 days)", value: "upcoming" },
            { label: "Future (> 30 days)", value: "future" },
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
            { label: "🆕 Newest First", value: "newest" },
            { label: "📅 Oldest First", value: "oldest" },
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
        actions={<div className="lg:hidden"><InsuranceForm accounts={accounts} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
                  policies={filteredPolicies} 
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
                                formatter={(value: any) => format(Number(value))}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
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
