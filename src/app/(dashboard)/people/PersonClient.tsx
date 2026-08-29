"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { Search, Users, ArrowDownRight, ArrowUpRight, LayoutGrid, PieChartIcon } from "lucide-react";
import { Select as AntSelect } from "antd";
import { MasterSearchField } from "@/components/layout/MasterView";
import { PersonForm } from "@/components/forms/PersonForm";
import { PersonList } from "@/components/lists/PersonList";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";

export function PersonClient({ initialPeople }: { initialPeople: any[] }) {
  const { format, formatCompact } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [relationFilter, setRelationFilter] = useState<string[]>(searchParams.get("relation") ? searchParams.get("relation")!.split(",") : []);
  const [balanceStatus, setBalanceStatus] = useState<string[]>(searchParams.get("balanceStatus") ? searchParams.get("balanceStatus")!.split(",") : []);
  const [hasVpa, setHasVpa] = useState<string[]>(searchParams.get("hasVpa") ? searchParams.get("hasVpa")!.split(",") : []);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");

    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");

    if (relationFilter.length > 0) current.set("relation", relationFilter.join(","));
    else current.delete("relation");

    if (balanceStatus.length > 0) current.set("balanceStatus", balanceStatus.join(","));
    else current.delete("balanceStatus");

    if (hasVpa.length > 0) current.set("hasVpa", hasVpa.join(","));
    else current.delete("hasVpa");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, relationFilter, pathname]);

  const isFilterActive = searchQuery !== "" || relationFilter.length > 0 || balanceStatus.length > 0 || hasVpa.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setRelationFilter([]);
    setBalanceStatus([]);
    setHasVpa([]);
  };

  const filteredPeople = React.useMemo(() => {
    let result = [...initialPeople];
    if (relationFilter.length > 0) {
      result = result.filter(p => relationFilter.includes(p.relation || "Other"));
    }
    if (balanceStatus.length > 0) {
      result = result.filter(p => {
        if (balanceStatus.includes("YouOwe") && p.netBalance < 0) return true;
        if (balanceStatus.includes("TheyOwe") && p.netBalance > 0) return true;
        if (balanceStatus.includes("Settled") && p.netBalance === 0) return true;
        return false;
      });
    }
    if (hasVpa.length > 0) {
      result = result.filter(p => {
        const hasId = p.vpas && p.vpas.length > 0;
        if (hasVpa.includes("yes") && hasId) return true;
        if (hasVpa.includes("no") && !hasId) return true;
        return false;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.phones && p.phones.some((ph: string) => ph.includes(q))) || (p.vpas && p.vpas.some((v: string) => v.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [initialPeople, relationFilter, balanceStatus, hasVpa, searchQuery]);

  // KPIs
  const totalOweUs = filteredPeople.filter((p: any) => p.netBalance > 0).reduce((acc: number, p: any) => acc + p.netBalance, 0);
  const totalWeOwe = filteredPeople.filter((p: any) => p.netBalance < 0).reduce((acc: number, p: any) => acc + Math.abs(p.netBalance), 0);

  // Chart data
  const chartData = [...filteredPeople]
    .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
    .slice(0, 10)
    .map((p: any) => ({
      name: p.name,
      "To Receive": p.netBalance > 0 ? p.netBalance : 0,
      "To Pay": p.netBalance < 0 ? Math.abs(p.netBalance) : 0,
    }));

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Name, phone, or VPA..." />
      
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Relationship</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Relations"
          value={relationFilter}
          onChange={setRelationFilter}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Friend", value: "Friend" },
            { label: "Family", value: "Family" },
            { label: "Colleague", value: "Colleague" },
            { label: "Merchant", value: "Merchant" },
            { label: "Shopkeeper", value: "Shopkeeper" },
            { label: "Other", value: "Other" },
          ]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Net Balance</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Balances"
          value={balanceStatus}
          onChange={setBalanceStatus}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "You Owe Them", value: "YouOwe" },
            { label: "They Owe You", value: "TheyOwe" },
            { label: "Settled (Zero)", value: "Settled" },
          ]}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Has UPI ID / VPA</h3>
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Any"
          value={hasVpa}
          onChange={setHasVpa}
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader
        title={<><Users className="w-6 h-6 text-primary" /> People Ledger</>}
        subtitle="Manage money you lent or borrowed."
        actions={<div className="sm:hidden"><PersonForm triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<PersonForm triggerClassName="h-9 sm:h-10 px-4 sm:px-6 text-sm sm:text-base font-semibold" />}
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
            {/* 
              Since PersonList has its own internal Tabs, we actually want to override it 
              with our external state. Let's make sure PersonList handles the active tab logic.
            */}
            <TabsContent value="data" className="h-full m-0">
              <div className="pb-24">
                <PersonList
                  people={filteredPeople}
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalTab={activeTab}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 pt-2 space-y-6">

                {/* KPI Cards row */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 shrink-0">
                  <KPICard
                    label="Money to Receive"
                    value={<CurrencyDisplay amount={totalOweUs} showSign />}
                    icon={ArrowDownRight}
                    themeColor="emerald"
                  />
                  <KPICard
                    label="Money to Pay"
                    value={<CurrencyDisplay amount={-totalWeOwe} showSign />}
                    icon={ArrowUpRight}
                    themeColor="destructive"
                  />
                </div>

                <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                    <h2 className="text-lg font-bold text-foreground">Top 10 People by Net Balance</h2>
                    <p className="text-sm text-muted-foreground mt-1">Comparison of money you need to receive vs pay.</p>
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
                            cursor={{ fill: 'var(--muted)' }}
                            contentStyle={{ 
                              backgroundColor: 'var(--card)', 
                              borderColor: 'var(--border)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              color: 'var(--foreground)'
                            }}
                            formatter={(value: any) => [format(Number(value)), undefined]}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="To Receive" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          <Bar dataKey="To Pay" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                        <div className="text-center text-muted-foreground">
                          <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No data to display graph.</p>
                        </div>
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
