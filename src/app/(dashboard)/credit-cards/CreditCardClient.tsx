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
import { Search, CreditCard, Banknote, ShieldAlert, CreditCard as CardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCardForm } from "@/components/forms/CreditCardForm";
import { CreditCardList } from "@/components/lists/CreditCardList";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export function CreditCardClient({ initialCards }: { initialCards: any[] }) {
  const { formatCompact, format } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [networkFilters, setNetworkFilters] = useState<string[]>(searchParams.get("networks") ? searchParams.get("networks")!.split(",") : []);
  const [rewardFilters, setRewardFilters] = useState<string[]>(searchParams.get("rewards") ? searchParams.get("rewards")!.split(",") : []);
  const [utilizationFilter, setUtilizationFilter] = useState<string[]>(searchParams.get("utilization") ? searchParams.get("utilization")!.split(",") : []);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "used-high");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams();
    if (activeTab !== "data") current.set("tab", activeTab);
    if (searchQuery) current.set("q", searchQuery);
    if (networkFilters.length > 0) current.set("networks", networkFilters.join(","));
    if (rewardFilters.length > 0) current.set("rewards", rewardFilters.join(","));
    if (utilizationFilter.length > 0) current.set("utilization", utilizationFilter.join(","));
    if (sortBy !== "used-high") current.set("sort", sortBy);

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, networkFilters, rewardFilters, utilizationFilter, sortBy, pathname]);

  const isFilterActive = searchQuery !== "" || networkFilters.length > 0 || rewardFilters.length > 0 || utilizationFilter.length > 0 || sortBy !== "used-high";

  const clearFilters = () => {
    setSearchQuery("");
    setNetworkFilters([]);
    setRewardFilters([]);
    setUtilizationFilter([]);
    setSortBy("used-high");
  };

  // Derived Data
  const filteredCards = useMemo(() => {
    let result = [...initialCards];

    if (networkFilters.length > 0) {
      result = result.filter(c => networkFilters.includes((c.cardNetwork || "").toLowerCase()));
    }

    if (rewardFilters.length > 0) {
      result = result.filter(c => rewardFilters.includes(c.rewardType || "none"));
    }

    if (utilizationFilter.length > 0) {
      result = result.filter(c => {
        const util = c.creditLimit > 0 ? ((c.currentOutstanding || 0) / c.creditLimit) * 100 : 0;
        if (utilizationFilter.includes("low") && util < 30) return true;
        if (utilizationFilter.includes("medium") && util >= 30 && util < 70) return true;
        if (utilizationFilter.includes("high") && util >= 70) return true;
        return false;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => {
        return (c.bankName || "").toLowerCase().includes(q) ||
               (c.cardName || "").toLowerCase().includes(q) ||
               (c.last4Digits || "").includes(q);
      });
    }

    return result;
  }, [initialCards, searchQuery, networkFilters]);

  // KPI Calculations
  const outstandingBalance = filteredCards.reduce((sum, c) => sum + (c.currentOutstanding || 0), 0);
  const totalCreditLimit = filteredCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const availableCredit = filteredCards.reduce((sum, c) => sum + (c.availableLimit || 0), 0);
  const activeCards = filteredCards.length;

  const utilization = totalCreditLimit > 0 ? (outstandingBalance / totalCreditLimit) * 100 : 0;

  // Chart Data: Stacked Bar Chart for Limit vs Outstanding
  const chartData = filteredCards.map(c => ({
    name: `${c.bankName} ${c.last4Digits}`,
    Outstanding: c.currentOutstanding,
    Available: c.availableLimit,
    Limit: c.creditLimit
  })).sort((a, b) => b.Outstanding - a.Outstanding).slice(0, 8); // Top 8 highest outstanding

  // Filter Panel Component
  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by bank or name..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Network</h3>
        <AntSelect
          mode="multiple"
          value={networkFilters}
          onChange={setNetworkFilters}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Visa", value: "visa" },
            { label: "Mastercard", value: "mastercard" },
            { label: "Amex", value: "amex" },
            { label: "Discover", value: "discover" },
            { label: "RuPay", value: "rupay" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Reward Type</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Rewards"
          value={rewardFilters}
          onChange={setRewardFilters}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Cashback", value: "cashback" },
            { label: "Miles", value: "miles" },
            { label: "Reward Points", value: "points" },
            { label: "None", value: "none" },
          ]}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Utilization</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any Utilization"
          value={utilizationFilter}
          onChange={setUtilizationFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Low (< 30%)", value: "low" },
            { label: "Medium (30-70%)", value: "medium" },
            { label: "High (>= 70%)", value: "high" },
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
            { label: "🔥 High Utilization", value: "used-high" },
            { label: "📉 Low Utilization", value: "used-low" },
            { label: "💰 Limit: High to Low", value: "limit-high" },
            { label: "💵 Limit: Low to High", value: "limit-low" },
            { label: "🔤 Bank: A to Z", value: "bank-asc" },
            { label: "🔤 Bank: Z to A", value: "bank-desc" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><CardIcon className="w-6 h-6 text-primary" /> Credit Cards</>}
        subtitle="Manage your credit cards, statements, and bills."
        actions={<div className="sm:hidden"><CreditCardForm triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<CreditCardForm triggerClassName="h-10 px-6 text-base font-semibold" />}
          />

          <MasterViewLayout
            sidebar={
              <MasterFilterSidebar isFilterActive={isFilterActive} onClearFilters={clearFilters}>
                {filterPanelContent}
              </MasterFilterSidebar>
            }
          >
            <TabsContent value="data" className="outline-none !mt-0 h-full">
              {filteredCards.length > 0 ? (
                <CreditCardList cards={filteredCards} hideToolbar externalSort={sortBy} />
              ) : (
                <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Cards Match Filters</h3>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="outline-none !mt-0 space-y-6">
              {/* KPI Cards Section */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <KPICard 
                  label="Outstanding Balance" 
                  value={<CurrencyDisplay amount={outstandingBalance} />} 
                  icon={ShieldAlert} 
                  themeColor={utilization > 50 ? "destructive" : "amber"} 
                />
                <KPICard label="Total Credit Limit" value={<CurrencyDisplay amount={totalCreditLimit} />} icon={Banknote} themeColor="indigo" />
                <KPICard label="Available Credit" value={<CurrencyDisplay amount={availableCredit} />} icon={CreditCard} themeColor="emerald" />
                <KPICard 
                  label="Total Active Cards" 
                  value={activeCards} 
                  icon={CardIcon} 
                  themeColor="primary" 
                  trend={<span className="text-sm font-medium opacity-80 inline-block text-primary">({utilization.toFixed(1)}% Used)</span>}
                />
              </div>

              {/* Chart */}
              <div className="bg-card border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-foreground">Card Utilization Breakdown</h3>
                <div className="h-[350px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)", opacity: 0.7 }}
                          tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)", opacity: 0.7 }}
                          tickFormatter={(value) => formatCompact(value)}
                        />
                        <Tooltip 
                          formatter={(value: any) => format(Number(value))}
                          cursor={{ fill: 'currentColor', opacity: 0.05 }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Outstanding" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} maxBarSize={50} />
                        <Bar dataKey="Available" stackId="a" fill="#10b981" fillOpacity={0.4} radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No credit card data to display</div>
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
