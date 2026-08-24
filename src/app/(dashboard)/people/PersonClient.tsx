"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer } from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Search, Users, ArrowDownRight, ArrowUpRight, LayoutGrid, PieChartIcon } from "lucide-react";
import { Select as AntSelect } from "antd";
import { PersonForm } from "@/components/forms/PersonForm";
import { PersonList } from "@/components/lists/PersonList";
import { usePathname, useSearchParams } from "next/navigation";

export function PersonClient({ initialPeople }: { initialPeople: any[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "data");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [relationFilter, setRelationFilter] = useState(searchParams.get("relation") || "All");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (activeTab !== "data") current.set("tab", activeTab);
    else current.delete("tab");

    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");

    if (relationFilter !== "All") current.set("relation", relationFilter);
    else current.delete("relation");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [activeTab, searchQuery, relationFilter, pathname]);

  const isFilterActive = searchQuery !== "" || relationFilter !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setRelationFilter("All");
  };

  // KPIs
  const totalOweUs = initialPeople.filter((p: any) => p.netBalance > 0).reduce((acc: number, p: any) => acc + p.netBalance, 0);
  const totalWeOwe = initialPeople.filter((p: any) => p.netBalance < 0).reduce((acc: number, p: any) => acc + Math.abs(p.netBalance), 0);

  const filterPanelContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Search</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Name, phone, or VPA..."
            className="w-full pl-9 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-card text-foreground px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Relationship</h3>
        <AntSelect
          value={relationFilter}
          onChange={setRelationFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "All Relations", value: "All" },
            { label: "Friend", value: "Friend" },
            { label: "Family", value: "Family" },
            { label: "Colleague", value: "Colleague" },
            { label: "Merchant", value: "Merchant" },
            { label: "Shopkeeper", value: "Shopkeeper" },
            { label: "Other", value: "Other" },
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
                  people={initialPeople}
                  hideToolbar={true}
                  externalSearch={searchQuery}
                  externalFilter={relationFilter}
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
                    <h2 className="text-lg font-bold text-foreground">Coming Soon</h2>
                    <p className="text-sm text-muted-foreground mt-1">Detailed graphs and analytics for your personal ledger will be available here.</p>
                  </div>
                  <div className="p-4 sm:p-6 h-[400px] flex items-center justify-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <div className="text-center text-muted-foreground">
                      <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Graph visualizations are under development.</p>
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
