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
import { Search, Wallet, Landmark, TrendingUp, TrendingDown, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/forms/AccountForm";
import { AccountList } from "@/components/lists/AccountList";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#14b8a6', '#6b7280'];

export function AccountClient({ initialAccounts }: { initialAccounts: any[] }) {
  const { format } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [typeFilters, setTypeFilters] = useState<string[]>(searchParams.get("types") ? searchParams.get("types")!.split(",") : []);
  const [liabilityFilter, setLiabilityFilter] = useState(searchParams.get("liability") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "balance-high");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams();
    if (activeTab !== "data") current.set("tab", activeTab);
    if (searchQuery) current.set("q", searchQuery);
    if (typeFilters.length > 0) current.set("types", typeFilters.join(","));
    if (liabilityFilter !== "all") current.set("liability", liabilityFilter);
    if (sortBy !== "balance-high") current.set("sort", sortBy);

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, typeFilters, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || typeFilters.length > 0 || liabilityFilter !== "all" || sortBy !== "balance-high";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilters([]);
    setLiabilityFilter("all");
    setSortBy("balance-high");
  };

  // Derived Data
  const filteredAccounts = useMemo(() => {
    let result = [...initialAccounts];

    if (typeFilters.length > 0) {
      result = result.filter(a => typeFilters.includes(a.type));
    }

    if (liabilityFilter !== "all") {
      result = result.filter(a => liabilityFilter === "liability" ? a.isLiability : !a.isLiability);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => (a.name || "").toLowerCase().includes(q));
    }

    return result;
  }, [initialAccounts, searchQuery, typeFilters]);
  
  const totalBalance = filteredAccounts.reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
  const activeCount = filteredAccounts.length;
  // TODO: Calculate real inflow/outflow from transactions related to these accounts
  const totalInflow = 0; 
  const totalOutflow = 0; 

  // Filter Panel Component
  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search accounts..." />
      
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Account Type</h3>
        <AntSelect
          mode="multiple"
          value={typeFilters}
          onChange={setTypeFilters}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Bank Account", value: "bank" },
            { label: "Cash", value: "cash" },
            { label: "Saving Account", value: "saving" },
            { label: "Credit Card", value: "card" },
            { label: "Wallet", value: "wallet" },
            { label: "Investment", value: "investment" },
            { label: "Other", value: "other" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Asset Class</h3>
        <AntSelect
          value={liabilityFilter}
          onChange={setLiabilityFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All Accounts", value: "all" },
            { label: "Assets (Positive)", value: "asset" },
            { label: "Liabilities (Debt)", value: "liability" },
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
            { label: "💰 Balance: High to Low", value: "balance-high" },
            { label: "💵 Balance: Low to High", value: "balance-low" },
            { label: "🔤 Name: A to Z", value: "name-asc" },
            { label: "🔤 Name: Z to A", value: "name-desc" },
          ]}
        />
      </div>
    </div>
  );

  // Chart Data: Balances by Type
  const typeBalances = filteredAccounts.reduce((acc, account) => {
    const t = (account.type || "other").toUpperCase();
    acc[t] = (acc[t] || 0) + (account.balance || 0);
    return acc;
  }, {} as Record<string, number>);
  
  const chartData: {name: string, value: number}[] = Object.entries(typeBalances)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Wallet className="w-6 h-6 text-primary" /> Accounts</>}
        subtitle="Manage your wallets, bank accounts, and credit cards."
        actions={<div className="sm:hidden"><AccountForm triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<AccountForm triggerClassName="h-10 px-6 text-base font-semibold" />}
          />

          <MasterViewLayout
            sidebar={
              <MasterFilterSidebar isFilterActive={isFilterActive} onClearFilters={clearFilters}>
                {filterPanelContent}
              </MasterFilterSidebar>
            }
          >
            <TabsContent value="data" className="outline-none !mt-0 h-full">
              {filteredAccounts.length > 0 ? (
                <AccountList accounts={filteredAccounts} hideToolbar externalSort={sortBy} />
              ) : (
                <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Accounts Match Filters</h3>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="outline-none !mt-0 space-y-6">
              {/* KPI Cards Section */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <KPICard label="Total Balance" value={<CurrencyDisplay amount={totalBalance} />} icon={Landmark} themeColor="primary" />
                <KPICard label="Total Inflow" value={<CurrencyDisplay amount={totalInflow} />} icon={TrendingUp} themeColor="emerald" />
                <KPICard label="Total Outflow" value={<CurrencyDisplay amount={totalOutflow} />} icon={TrendingDown} themeColor="destructive" />
                <KPICard label="Active Accounts" value={activeCount} icon={LayoutList} themeColor="amber" />
              </div>

              {/* Chart */}
              <div className="bg-card border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-foreground">Account Balances Breakdown</h3>
                <div className="h-[350px] w-full">
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
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No account balances to display</div>
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
