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
import { Search, Tags, Tag, TrendingDown, ArrowRight, LayoutList } from "lucide-react";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { CategoryList } from "@/components/lists/CategoryList";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatIndianNumber } from "@/lib/numberHelper";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY } from "@/lib/designTokens";

export function CategoryClient({ 
  expenseCategories,
  incomeCategories 
}: { 
  expenseCategories: any[];
  incomeCategories: any[];
}) {
  const { format, formatCompact } = useCurrency();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [categoryType, setCategoryType] = useState(searchParams.get("type") || "expense");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");
    
    if (categoryType !== "expense") current.set("type", categoryType);
    else current.delete("type");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, categoryType, pathname]);

  const isFilterActive = searchQuery !== "" || categoryType !== "expense";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryType("expense");
  };

  // Derived Data
  const totalCategories = expenseCategories.length + incomeCategories.length;
  
  // TODO: Calculate real spend metrics by fetching transactions aggregated by category.
  // For now, we stub these to 0 as per architectural placeholder pattern.
  const highestSpendCategoryName = expenseCategories.length > 0 ? expenseCategories[0]?.name : "N/A";
  const highestSpendAmount = 0; 
  const totalCategorizedSpend = 0;
  const averageSpend = expenseCategories.length > 0 ? (totalCategorizedSpend / expenseCategories.length) : 0;

  // Placeholder chart data
  const chartData = expenseCategories.slice(0, 10).map((c, index) => ({
    name: c.name,
    Spend: Math.max(1000, 10000 - index * 1000) // Placeholder data so the graph is visible
  }));

  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search categories..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <AntSelect
          value={categoryType}
          onChange={setCategoryType}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Tags className="w-6 h-6 text-primary" /> Categories</>}
        subtitle="Manage your expense and income categories."
        actions={<div className="lg:hidden"><CategoryForm triggerClassName="h-9 px-4 text-sm font-semibold" /></div>}
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
            primaryAction={<CategoryForm triggerClassName="h-9 px-4 text-xs sm:text-sm font-semibold" />}
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
                <CategoryList 
                  expenseCategories={expenseCategories} 
                  incomeCategories={incomeCategories}
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalType={categoryType}
                />
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                
                {/* KPI Cards */}
                <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                  <KPICard label="Total Categories" value={totalCategories.toString()} icon={LayoutList} themeColor="indigo" />
                  <KPICard label="Highest Spend" value={highestSpendCategoryName} icon={Tag} themeColor="destructive" />
                  <KPICard 
                    label="Total Categorized" 
                    value={<CurrencyDisplay amount={totalCategorizedSpend} />} 
                    icon={TrendingDown} 
                    themeColor="amber" 
                  />
                  <KPICard 
                    label="Average Spend" 
                    value={<CurrencyDisplay amount={averageSpend} />} 
                    icon={ArrowRight} 
                    themeColor="emerald" 
                  />
                </div>

                {/* Graph Area */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
                      <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className={cn(TYPOGRAPHY.sectionTitle)}>Top 10 Categories by Spend</h2>
                        <p className={cn(TYPOGRAPHY.headerSubtitle, "mt-1")}>Highest outflow categories this period.</p>
                      </div>
                      <div className="p-4 sm:p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                            <XAxis 
                              type="number"
                              tickFormatter={(val: number) => formatCompact(val)}
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis 
                              type="category"
                              dataKey="name" 
                              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                              axisLine={false} 
                              tickLine={false} 
                              width={100}
                            />
                            <Tooltip 
                              formatter={(value: any) => format(Number(value))}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                              itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Bar dataKey="Spend" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={30} />
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
