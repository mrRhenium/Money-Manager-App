"use client";

import React, { useState, useMemo } from "react";
import { Table, Switch, message, Tooltip as AntTooltip, Select as AntSelect } from "antd";
import {
  Sparkles,
  Search,
  Grid,
  List as ListIcon,
  RotateCw,
  FolderTree,
  Tag,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChartIcon,
  Layers,
  Check,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import { toggleIconStatus, reseedDefaultIcons } from "@/actions/icon";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
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

  // Categories extraction for filter pills
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
  const activeCount = icons.filter((i) => i.isActive).length;
  const inactiveCount = totalCount - activeCount;
  const consumedCount = icons.filter((i) => i.usageCount > 0 || i.isConsumed).length;

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

  // Handle active status toggle
  const handleToggleStatus = async (id: string, currentVal: boolean) => {
    try {
      const res = await toggleIconStatus(id);
      if (res.success) {
        setIcons((prev) =>
          prev.map((i) => (i._id === id ? { ...i, isActive: res.isActive } : i))
        );
        message.success("Status updated");
      } else {
        message.error(res.error || "Failed to update status");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to update status");
    }
  };

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
            { label: `Unused (${totalCount - consumedCount})`, value: "unused" },
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
      title: "Status",
      key: "isActive",
      dataIndex: "isActive",
      render: (isActive: boolean, record: any) => (
        <Switch
          size="small"
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record._id, checked)}
        />
      ),
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
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary shrink-0" />
            <span>System Icons</span>
          </div>
        }
        subtitle="Manage master icon catalog, categories, search tags, and usage safety."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncDefaults}
              disabled={syncing}
              className="h-9 px-3 text-xs font-medium rounded-xl border-dashed"
              title="Reseed & Sync standard icons"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              Sync Defaults
            </Button>
            <IconFormModal onSuccess={() => window.location.reload()} />
          </div>
        }
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
            primaryAction={<IconFormModal onSuccess={() => window.location.reload()} />}
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
              <div className="pb-24 space-y-4">
                {/* Secondary Bar: Category Pills & Grid/Table Switch */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border rounded-2xl shadow-xs">
                  {/* Category Pills Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 flex-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Grid/Table Switch */}
                  <div className="flex items-center border rounded-xl p-0.5 bg-muted/40 shrink-0 self-end sm:self-auto">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 rounded-lg"
                      title="Grid View"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("table")}
                      className="h-8 w-8 rounded-lg"
                      title="Table View"
                    >
                      <ListIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Grid or Table render */}
                {viewMode === "grid" ? (
                  filteredIcons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {filteredIcons.map((icon) => {
                        const catColor = CATEGORY_COLORS[icon.category] || "#64748b";
                        const isUsed = icon.usageCount > 0 || icon.isConsumed;

                        return (
                          <div
                            key={icon._id}
                            className={`group relative p-4 rounded-2xl bg-card border transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between ${
                              !icon.isActive ? "opacity-60 bg-muted/20" : ""
                            }`}
                          >
                            <div>
                              {/* Card Header: Icon & Actions */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs transition-transform group-hover:scale-105"
                                  style={{
                                    backgroundColor: `${catColor}15`,
                                    borderColor: `${catColor}30`,
                                    color: catColor,
                                  }}
                                >
                                  <DynamicLucideIcon name={icon.name} className="w-5 h-5" />
                                </div>

                                <div className="flex items-center gap-1">
                                  <Switch
                                    size="small"
                                    checked={icon.isActive}
                                    onChange={(checked) => handleToggleStatus(icon._id, checked)}
                                  />
                                  <IconFormModal
                                    icon={icon}
                                    onSuccess={() => window.location.reload()}
                                  />
                                  <IconDeleteModal
                                    icon={icon}
                                    onSuccess={() => {
                                      setIcons((prev) => prev.filter((i) => i._id !== icon._id));
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Label & Technical Key */}
                              <div className="space-y-0.5 mb-2.5">
                                <div className="font-bold text-sm text-foreground truncate" title={icon.label}>
                                  {icon.label}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">{icon.name}</div>
                              </div>

                              {/* Category & Tags */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-medium py-0 px-1.5 border"
                                  style={{
                                    backgroundColor: `${catColor}10`,
                                    color: catColor,
                                    borderColor: `${catColor}30`,
                                  }}
                                >
                                  {icon.category || "General"}
                                </Badge>

                                {icon.tags &&
                                  icon.tags.slice(0, 2).map((t: string) => (
                                    <span
                                      key={t}
                                      className="text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border"
                                    >
                                      #{t}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Card Footer: Usage Status Indicator */}
                            <div className="pt-2 border-t flex items-center justify-between text-xs">
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
                                <span className="text-muted-foreground text-[10px]">Unused</span>
                              )}

                              <span className="text-[10px] text-muted-foreground">
                                {icon.isDefault ? "System" : "Custom"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4 bg-card border border-dashed rounded-2xl">
                      <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-bold text-foreground">No Icons Found</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        No icons match your search or filter criteria. Try adjusting your search keywords.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                    <Table
                      dataSource={filteredIcons}
                      columns={tableColumns}
                      rowKey="_id"
                      pagination={{ pageSize: 12, showSizeChanger: true }}
                      className="custom-table"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* INSIGHTS & GRAPHS TAB */}
            <TabsContent value="insights" className="h-full m-0">
              <div className="pb-24 space-y-6">
                {/* 1. KPI Cards Row */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <KPICard
                    label="Total Icons"
                    value={totalCount}
                    icon={Sparkles}
                    themeColor="indigo"
                  />
                  <KPICard
                    label="Active In Forms"
                    value={activeCount}
                    icon={CheckCircle2}
                    themeColor="emerald"
                  />
                  <KPICard
                    label="Inactive"
                    value={inactiveCount}
                    icon={XCircle}
                    themeColor="amber"
                  />
                  <KPICard
                    label="In Active Use"
                    value={consumedCount}
                    icon={ShieldCheck}
                    themeColor="primary"
                    trend={<span className="text-[11px] text-muted-foreground">Delete Protected</span>}
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
