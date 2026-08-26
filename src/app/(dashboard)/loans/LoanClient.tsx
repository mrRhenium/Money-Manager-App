"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Search, Landmark, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertTriangle, LayoutList } from "lucide-react";
import { LoanForm } from "@/components/forms/LoanForm";
import { LoanList } from "@/components/lists/LoanList";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";

export function LoanClient({ 
  initialLoans, 
  accounts
}: { 
  initialLoans: any[];
  accounts: any[];
}) {
  const { format, formatCompact } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [listTab, setListTab] = useState(searchParams.get("status") || "active");
  const [typeFilter, setTypeFilter] = useState<string[]>(searchParams.get("type") ? searchParams.get("type")!.split(",") : []);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date-nearest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (listTab !== "active") current.set("status", listTab);
    else current.delete("status");

    if (typeFilter.length > 0) current.set("type", typeFilter.join(","));
    else current.delete("type");

    if (sortBy !== "date-nearest") current.set("sort", sortBy);
    else current.delete("sort");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, listTab, typeFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || listTab !== "active" || typeFilter.length > 0 || sortBy !== "date-nearest";

  const clearFilters = () => {
    setSearchQuery("");
    setListTab("active");
    setTypeFilter([]);
    setSortBy("date-nearest");
  };

  // Derived Data (KPIs)
  const filteredLoans = useMemo(() => {
    let result = [...initialLoans];

    if (typeFilter.length > 0) {
      result = result.filter((l: any) => typeFilter.includes(l.type));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l: any) => (l.name || "").toLowerCase().includes(q));
    }

    return result;
  }, [initialLoans, searchQuery, typeFilter]);

  const activeLoans = filteredLoans.filter((l: any) => l.status === "active");
  const totalOutstanding = activeLoans.reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);
  const totalBorrowed = activeLoans.reduce((sum: number, l: any) => sum + (l.totalAmount || 0), 0);
  const totalEmiPaid = totalBorrowed - totalOutstanding;
  
  // Liabilities vs Assets (for reference)
  const totalLiabilities = activeLoans.filter((l: any) => l.type === "taken").reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);
  const totalAssets = activeLoans.filter((l: any) => l.type === "given").reduce((sum: number, l: any) => sum + (l.outstandingBalance || 0), 0);

  // Chart data
  const chartData = activeLoans.map((l: any) => ({
    name: l.name,
    "Repaid": (l.totalAmount || 0) - (l.outstandingBalance || 0),
    "Outstanding": l.outstandingBalance || 0,
    total: l.totalAmount || 0
  })).sort((a: any, b: any) => b.total - a.total).slice(0, 10);

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search loans..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Status</h3>
        <AntSelect
          value={listTab}
          onChange={setListTab}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Loan Type</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Types"
          value={typeFilter}
          onChange={setTypeFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Taken (Liabilities) 📉", value: "taken" },
            { label: "Given (Assets) 📈", value: "given" },
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
            { label: "EMI: Nearest First", value: "date-nearest" },
            { label: "EMI: Farthest First", value: "date-farthest" },
            { label: "Outstanding: High to Low", value: "out-high" },
            { label: "Outstanding: Low to High", value: "out-low" },
            { label: "Progress: Most Paid", value: "prog-high" },
            { label: "Progress: Least Paid", value: "prog-low" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Landmark className="w-6 h-6 text-primary" /> Loans & EMIs</>}
        subtitle="Track your debts, active EMIs, and money lent to others."
        actions={<div className="sm:hidden"><LoanForm accounts={accounts} triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<LoanForm accounts={accounts} triggerClassName="h-10 px-6 text-base font-semibold" />}
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
                <LoanList 
                  loans={filteredLoans} 
                  accounts={accounts} 
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
                  <KPICard label="Active Loans" value={activeLoans.length.toString()} icon={LayoutList} themeColor="indigo" />
                  <KPICard 
                    label="Total Outstanding" 
                    value={<CurrencyDisplay amount={totalOutstanding} />} 
                    icon={AlertTriangle} 
                    themeColor="destructive" 
                  />
                  <KPICard 
                    label="Total Borrowed" 
                    value={<CurrencyDisplay amount={totalBorrowed} />} 
                    icon={ArrowDownLeft} 
                    themeColor="amber" 
                  />
                  <KPICard 
                    label="Total EMI Paid" 
                    value={<CurrencyDisplay amount={totalEmiPaid} />} 
                    icon={CheckCircle2} 
                    themeColor="emerald" 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="text-lg font-bold text-foreground">Top 10 Loans (Repaid vs Outstanding)</h2>
                        <p className="text-sm text-muted-foreground mt-1">Comparison of amount paid and remaining balance.</p>
                      </div>
                      <div className="p-4 sm:p-6 h-[400px]">
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10} 
                              />
                              <YAxis 
                                tickFormatter={(val: number) => formatCompact(val)}
                                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                                axisLine={false} 
                                tickLine={false} 
                                dx={-10}
                              />
                              <Tooltip 
                                formatter={(value: any) => format(Number(value))}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '20px' }} />
                              <Bar dataKey="Repaid" stackId="a" fill="#10b981" maxBarSize={40} />
                              <Bar dataKey="Outstanding" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                            <Landmark className="w-8 h-8 mb-2 opacity-50" />
                            <p>No active loans to chart.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional KPI context for Loans */}
                  <div className="space-y-4">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-red-500/5 overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <h2 className="text-sm font-medium text-muted-foreground">Total Liabilities (Taken)</h2>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          <CurrencyDisplay amount={totalLiabilities} />
                        </div>
                      </div>
                    </div>
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-emerald-500/5 overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <h2 className="text-sm font-medium text-muted-foreground">Total Assets (Given)</h2>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          <CurrencyDisplay amount={totalAssets} />
                        </div>
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
