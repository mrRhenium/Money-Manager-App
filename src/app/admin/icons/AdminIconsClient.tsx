"use client";

import React, { useState, useMemo } from "react";
import { Table, List, message, Tooltip as AntTooltip, Select as AntSelect } from "antd";
import {
  Sparkles,
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  PieChartIcon,
  LayoutGrid,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterHeader } from "@/components/layout/MasterHeader";
import {
  MasterToolbar,
  MasterViewLayout,
  MasterFilterSidebar,
  MasterFilterDrawer,
  MasterSearchField,
} from "@/components/layout/MasterView";
import { KPICard } from "@/components/dashboard/KPICard";
import { DynamicLucideIcon } from "@/components/ui/IconColorPicker";
import { IconFormModal } from "@/components/admin/IconFormModal";
import { IconDeleteModal } from "@/components/admin/IconDeleteModal";
import { reseedDefaultIcons } from "@/actions/icon";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const CATEGORY_COLORS: { [cat: string]: string } = {
  Finance: "#0ea5e9",
  Shopping: "#ec4899",
  "Food & Dining": "#f59e0b",
  Transport: "#6366f1",
  Housing: "#10b981",
  Health: "#ef4444",
  Education: "#8b5cf6",
  Work: "#14b8a6",
  Entertainment: "#f97316",
  Family: "#ec4899",
  Investments: "#3b82f6",
  General: "#64748b",
};

interface AdminIconsClientProps {
  icons: any[];
}

export function AdminIconsClient({ icons: initialIcons }: AdminIconsClientProps) {
  const [icons, setIcons] = useState<any[]>(initialIcons);
  const [activeTab, setActiveTab] = useState("data");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [usageFilter, setUsageFilter] = useState<"all" | "inUse" | "unused">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filtered Icons List
  const filteredIcons = useMemo(() => {
    return icons.filter((item) => {
      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      // Usage filter
      if (usageFilter === "inUse" && !(item.usageCount > 0 || item.isConsumed)) {
        return false;
      }
      if (usageFilter === "unused" && (item.usageCount > 0 || item.isConsumed)) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchCat = (item.category || "").toLowerCase().includes(q);
        const matchTags = (item.tags || []).some((t: string) => t.toLowerCase().includes(q));
        if (!matchName && !matchLabel && !matchCat && !matchTags) return false;
      }
      return true;
    });
  }, [icons, selectedCategory, usageFilter, searchQuery]);

  // Categories extraction for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    icons.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ["All", ...Array.from(set)];
  }, [icons]);

  const isFilterActive = searchQuery !== "" || selectedCategory !== "All" || usageFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setUsageFilter("all");
  };

  // KPI Calculations
  const totalCount = icons.length;
  const consumedCount = icons.filter((i) => i.usageCount > 0 || i.isConsumed).length;
  const unusedCount = totalCount - consumedCount;

  // Chart data: Distribution by category
  const categoryChartData = useMemo(() => {
    const counts: { [cat: string]: number } = {};
    icons.forEach((i) => {
      const cat = i.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#64748b",
    }));
  }, [icons]);

  // Chart data: Most used icons
  const topUsedIconsData = useMemo(() => {
    return icons
      .filter((i) => (i.usageCount || 0) > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 8)
      .map((i) => ({
        name: i.label,
        count: i.usageCount || 0,
      }));
  }, [icons]);

  // Handle default icons sync
  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      const res = await reseedDefaultIcons();
      if (res.success) {
        message.success(res.message || "Icons synced");
        window.location.reload();
      } else {
        message.error(res.error || "Failed to sync icons");
      }
    } catch (err: any) {
      message.error(err.message || "Error syncing icons");
    } finally {
      setSyncing(false);
    }
  };

  // Sidebar Filter Panel Content
  const filterPanelContent = (
    <div className="space-y-6">
      <MasterSearchField
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search icons by name, label, tags..."
      />

      <div>
        <h3 className="font-semibold mb-2 text-xs text-muted-foreground uppercase tracking-wider">
          Category
        </h3>
        <AntSelect
          value={selectedCategory}
          onChange={setSelectedCategory}
          className="w-full h-9"
          options={categories.map((c) => ({ label: c, value: c }))}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-xs text-muted-foreground uppercase tracking-wider">
          Usage Status
        </h3>
        <AntSelect
          value={usageFilter}
          onChange={setUsageFilter}
          className="w-full h-9"
          options={[
            { label: `All Icons (${icons.length})`, value: "all" },
            { label: `In Use (${consumedCount})`, value: "inUse" },
            { label: `Unused (${unusedCount})`, value: "unused" },
          ]}
        />
      </div>
    </div>
  );

  // Table Columns
  const tableColumns = [
    {
      title: "Icon",
      key: "icon",
      width: 60,
      render: (_: any, record: any) => {
        const catColor = CATEGORY_COLORS[record.category] || "#64748b";
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs"
            style={{
              backgroundColor: `${catColor}15`,
              borderColor: `${catColor}30`,
              color: catColor,
            }}
          >
            <DynamicLucideIcon name={record.name} className="w-4 h-4" />
          </div>
        );
      },
    },
    {
      title: "Label & Key",
      key: "label",
      render: (_: any, record: any) => (
        <div className="min-w-[130px]">
          <div className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
            {record.label}
            {record.isDefault && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-normal">
                Default
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">{record.name}</div>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      dataIndex: "category",
      render: (cat: string) => {
        const color = CATEGORY_COLORS[cat] || "#64748b";
        return (
          <Badge
            variant="outline"
            className="text-[11px] font-medium border"
            style={{
              backgroundColor: `${color}10`,
              color: color,
              borderColor: `${color}30`,
            }}
          >
            {cat || "General"}
          </Badge>
        );
      },
    },
    {
      title: "Tags",
      key: "tags",
      dataIndex: "tags",
      responsive: ["md" as const],
      render: (tags: string[]) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {tags && tags.length > 0 ? (
            tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border"
              >
                #{t}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
          {tags && tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      title: "Usage in App",
      key: "usageCount",
      render: (_: any, record: any) => {
        const isUsed = record.usageCount > 0 || record.isConsumed;
        return (
          <div>
            {isUsed ? (
              <AntTooltip
                title={
                  <div className="text-xs space-y-1">
                    {record.usages?.map((u: any) => (
                      <div key={u.entity}>
                        {u.entity}: {u.count}
                      </div>
                    ))}
                  </div>
                }
              >
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20 cursor-pointer">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  In Use ({record.usageCount || 0})
                </span>
              </AntTooltip>
            ) : (
              <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
                Unused
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-1">
          <IconFormModal
            icon={record}
            onSuccess={() => {
              window.location.reload();
            }}
          />
          <IconDeleteModal
            icon={record}
            onSuccess={() => {
              setIcons((prev) => prev.filter((i) => i._id !== record._id));
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <MasterHeader
        title={
          <><Sparkles className="w-6 h-6 text-primary shrink-0" /> System Icons</>
        }
        subtitle="Manage master icon catalog, categories, search tags, and usage safety."
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
            primaryAction={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSyncDefaults}
                  disabled={syncing}
                  className="h-9 px-3 text-xs font-medium rounded-xl border-dashed"
                  title="Reseed & Sync standard icons"
                >
                  <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                  Sync
                </Button>
                <IconFormModal onSuccess={() => window.location.reload()} />
              </div>
            }
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
            {/* DATA VIEW TAB */}
            <TabsContent value="data" className="h-full m-0">
              <div className="pb-24 pt-2 space-y-4">
                {filteredIcons.length > 0 ? (
                  <>
                    {/* List View for Laptop / Desktop */}
                    <div className="hidden lg:block rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden w-full">
                      <Table
                        columns={tableColumns}
                        dataSource={filteredIcons}
                        rowKey="_id"
                        pagination={{
                          defaultPageSize: 15,
                          position: ["bottomRight"],
                          showSizeChanger: true,
                          pageSizeOptions: ["10", "15", "30", "50"],
                        }}
                        scroll={{ x: "max-content" }}
                        className="w-full"
                      />
                    </div>

                    {/* Cards View for Mobile and Tablet */}
                    <div className="lg:hidden w-full">
                      <List
                        grid={{ gutter: 12, xs: 1, sm: 2, md: 2, lg: 2 }}
                        dataSource={filteredIcons}
                        pagination={{ pageSize: 12, align: "center", size: "small" }}
                        renderItem={(icon: any) => {
                          const catColor = CATEGORY_COLORS[icon.category] || "#64748b";
                          const isUsed = icon.usageCount > 0 || icon.isConsumed;

                          return (
                            <List.Item className="border-none px-0 py-1.5">
                              <div className="bg-card w-full h-full border shadow-2xs rounded-2xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden">
                                {/* Left accent indicator */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1"
                                  style={{ backgroundColor: catColor }}
                                />

                                <div>
                                  {/* Card Header: Icon, Label & Actions */}
                                  <div className="flex justify-between items-start pl-1 mb-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0"
                                        style={{
                                          backgroundColor: `${catColor}15`,
                                          borderColor: `${catColor}30`,
                                          color: catColor,
                                        }}
                                      >
                                        <DynamicLucideIcon name={icon.name} className="w-5 h-5" />
                                      </div>

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="font-semibold text-foreground text-sm truncate leading-none"
                                            title={icon.label}
                                          >
                                            {icon.label}
                                          </span>
                                          {icon.isDefault && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-normal shrink-0">
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono mt-1 truncate">
                                          {icon.name}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <IconFormModal
                                        icon={icon}
                                        onSuccess={() => window.location.reload()}
                                      />
                                      <IconDeleteModal
                                        icon={icon}
                                        onSuccess={() => {
                                          setIcons((prev) =>
                                            prev.filter((i) => i._id !== icon._id)
                                          );
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Category & Tags Row */}
                                  <div className="pl-1 flex flex-wrap items-center gap-1.5 mt-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-medium py-0.5 px-2 border"
                                      style={{
                                        backgroundColor: `${catColor}10`,
                                        color: catColor,
                                        borderColor: `${catColor}30`,
                                      }}
                                    >
                                      {icon.category || "General"}
                                    </Badge>

                                    {icon.tags &&
                                      icon.tags.length > 0 &&
                                      icon.tags.slice(0, 3).map((t: string) => (
                                        <span
                                          key={t}
                                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border"
                                        >
                                          #{t}
                                        </span>
                                      ))}
                                    {icon.tags && icon.tags.length > 3 && (
                                      <span className="text-[9px] text-muted-foreground">
                                        +{icon.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Card Footer: Usage Status Indicator */}
                                <div className="pl-1 pt-2.5 border-t flex items-center justify-between text-xs">
                                  {isUsed ? (
                                    <AntTooltip
                                      title={
                                        <div className="text-xs space-y-1">
                                          {icon.usages?.map((u: any) => (
                                            <div key={u.entity}>
                                              {u.entity}: {u.count}
                                            </div>
                                          ))}
                                        </div>
                                      }
                                    >
                                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] cursor-pointer">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        In Use ({icon.usageCount || 0})
                                      </span>
                                    </AntTooltip>
                                  ) : (
                                    <span className="text-muted-foreground text-[10px]">
                                      Unused
                                    </span>
                                  )}

                                  <span className="text-[10px] text-muted-foreground">
                                    {icon.isDefault ? "System" : "Custom"}
                                  </span>
                                </div>
                              </div>
                            </List.Item>
                          );
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 px-4 bg-card border border-dashed rounded-2xl">
                    <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-bold text-foreground">No Icons Found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      No icons match your search or filter criteria. Try adjusting your search keywords.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* INSIGHTS & GRAPHS TAB */}
            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                {/* 1. KPI Cards Row */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <KPICard
                    label="Total Icons"
                    value={totalCount}
                    icon={Sparkles}
                    themeColor="indigo"
                  />
                  <KPICard
                    label="In Active Use"
                    value={consumedCount}
                    icon={ShieldCheck}
                    themeColor="emerald"
                    trend={<span className="text-[11px] text-muted-foreground">Delete Protected</span>}
                  />
                  <KPICard
                    label="Unused"
                    value={unusedCount}
                    icon={CheckCircle2}
                    themeColor="amber"
                    className="col-span-2 sm:col-span-1"
                  />
                </div>

                {/* 2. Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Breakdown Donut */}
                  <Card className="rounded-2xl shadow-xs">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-primary" />
                        Icons by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="p-2.5 bg-card border rounded-xl shadow-md text-xs">
                                    <span className="font-semibold text-foreground">{data.name}: </span>
                                    <span className="font-bold text-primary">{data.value} icons</span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Most Utilized Icons Bar Chart */}
                  <Card className="rounded-2xl shadow-xs">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Top Utilized Icons Across Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {topUsedIconsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topUsedIconsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <RechartsTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="p-2 bg-card border rounded-xl shadow-md text-xs">
                                      <span className="font-semibold">{payload[0].payload.name}: </span>
                                      <span className="font-bold text-primary">
                                        {payload[0].value} records
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
                          <ShieldCheck className="w-8 h-8 opacity-40 mb-2" />
                          No icons are currently assigned to records.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </MasterViewLayout>
        </Tabs>
      </div>

      {/* Mobile Filter Drawer */}
      <MasterFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        isFilterActive={isFilterActive}
        onClearFilters={clearFilters}
      >
        {filterPanelContent}
      </MasterFilterDrawer>
    </>
  );
}
