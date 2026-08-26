"use client";

import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Database, HardDrive, LayoutList, Layers, Search, Server } from "lucide-react";
import { Table, List } from "antd";
import { KPICard } from "@/components/dashboard/KPICard";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterViewLayout, MasterToolbar } from "@/components/layout/MasterView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CollectionData {
  modelName: string;
  collectionName: string;
  count: number;
  size: number;
  storageSize: number;
  avgObjSize: number;
  error?: string;
}

interface AnalyticsData {
  global: {
    dbName: string;
    collectionsCount: number;
    objectsCount: number;
    avgObjSize: number;
    dataSize: number;
    storageSize: number;
    indexesCount: number;
    indexSize: number;
  };
  collections: CollectionData[];
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#06b6d4"
];

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DatabaseDashboard({ initialData }: { initialData: AnalyticsData }) {
  const { global, collections } = initialData;
  const [activeTab, setActiveTab] = useState("data");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(c =>
      c.modelName.toLowerCase().includes(q) || c.collectionName.toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  const storageChartData = useMemo(() => {
    return collections
      .filter(c => c.storageSize > 0)
      .map(c => ({
        name: c.modelName,
        value: c.storageSize,
        formatted: formatBytes(c.storageSize)
      }));
  }, [collections]);

  const countChartData = useMemo(() => {
    return collections
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        name: c.modelName,
        count: c.count
      }));
  }, [collections]);

  const getColumnSearchProps = (dataIndex: string, title: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div className="p-3 w-64 bg-card border border-border shadow-md rounded-xl flex flex-col gap-3" onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Search ${title}...`}
          value={selectedKeys[0] || ""}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          className="h-9"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => clearFilters && clearFilters()} className="h-8 px-3 text-xs">
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={() => confirm()} className="h-8 px-3 text-xs">
            Search
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search className={`w-4 h-4 ${filtered ? 'text-primary' : 'text-muted-foreground'}`} />
    ),
    onFilter: (value: any, record: any) => {
      const text = record[dataIndex];
      return text ? text.toString().toLowerCase().includes((value as string).toLowerCase()) : false;
    },
  });

  const columns = [
    {
      title: "Sr. No.",
      key: "sno",
      width: 70,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Model Name",
      dataIndex: "modelName",
      key: "modelName",
      ...getColumnSearchProps("modelName", "Model Name"),
      render: (text: string) => <span className="font-semibold text-primary">{text}</span>
    },
    {
      title: "Collection",
      dataIndex: "collectionName",
      key: "collectionName",
      ...getColumnSearchProps("collectionName", "Collection"),
      render: (text: string) => <span className="text-muted-foreground">{text}</span>
    },
    {
      title: "Documents",
      dataIndex: "count",
      key: "count",
      align: "right" as const,
      sorter: (a: any, b: any) => a.count - b.count,
      render: (count: number) => <span className="font-mono">{count.toLocaleString()}</span>
    },
    {
      title: "Data Size",
      dataIndex: "size",
      key: "size",
      align: "right" as const,
      sorter: (a: any, b: any) => a.size - b.size,
      render: (size: number) => <span>{formatBytes(size)}</span>
    },
    {
      title: "Storage Size",
      dataIndex: "storageSize",
      key: "storageSize",
      align: "right" as const,
      sorter: (a: any, b: any) => a.storageSize - b.storageSize,
      defaultSortOrder: 'descend' as const,
      render: (size: number) => <span className="font-medium text-emerald-500">{formatBytes(size)}</span>
    },
    {
      title: "Avg Object",
      dataIndex: "avgObjSize",
      key: "avgObjSize",
      align: "right" as const,
      sorter: (a: any, b: any) => a.avgObjSize - b.avgObjSize,
      render: (size: number) => <span className="text-muted-foreground">{formatBytes(size)}</span>
    }
  ];

  return (
    <MasterLayout>
      <MasterHeader
        title={<><Database className="w-6 h-6 text-primary" /> Database Analytics</>}
        subtitle="Monitor MongoDB storage allocation, sizes, and documents."
      />

      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
        {/* KPI Cards */}
        <div className="flex overflow-x-auto snap-x md:grid md:grid-cols-4 gap-3 mb-4 pb-2 shrink-0 [&::-webkit-scrollbar]:hidden -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="min-w-[75vw] sm:min-w-[40vw] md:min-w-0 shrink-0 snap-start">
            <KPICard 
              label="Database Storage (512MB Limit)"
              value={formatBytes(global.storageSize + global.indexSize)}
              icon={HardDrive}
              themeColor="primary"
              trend={<span className="text-[10px] sm:text-xs text-muted-foreground">Remaining: {formatBytes(536870912 - (global.storageSize + global.indexSize))}</span>}
            />
          </div>
          <div className="min-w-[75vw] sm:min-w-[40vw] md:min-w-0 shrink-0 snap-start">
            <KPICard
              label="Total Documents"
              value={global.objectsCount.toLocaleString()}
              icon={Layers}
              themeColor="emerald"
              trend={<span className="text-[10px] sm:text-xs text-muted-foreground">Avg Obj: {formatBytes(global.avgObjSize)}</span>}
            />
          </div>
          <div className="min-w-[75vw] sm:min-w-[40vw] md:min-w-0 shrink-0 snap-start">
            <KPICard
              label="Collections"
              value={global.collectionsCount}
              icon={LayoutList}
              themeColor="indigo"
              trend={<span className="text-[10px] sm:text-xs text-muted-foreground">Models: {collections.length}</span>}
            />
          </div>
          <div className="min-w-[75vw] sm:min-w-[40vw] md:min-w-0 shrink-0 snap-start">
            <KPICard
              label="Database Name"
              value={<span className="truncate max-w-full block" title={global.dbName}>{global.dbName}</span>}
              icon={Database}
              themeColor="amber"
              trend={<span className="text-[10px] sm:text-xs text-muted-foreground">Indexes: {global.indexesCount}</span>}
            />
          </div>
        </div>

        <MasterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isFilterActive={false}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <MasterViewLayout>
          {activeTab === "insights" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="font-semibold text-lg mb-1 text-foreground">Storage Distribution</h3>
                <p className="text-sm text-muted-foreground mb-6">Percentage of storage used by collection</p>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {storageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: any) => formatBytes(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card)', color: 'var(--foreground)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="font-semibold text-lg mb-1 text-foreground">Top Collections (Count)</h3>
                <p className="text-sm text-muted-foreground mb-6">Most populated models in the database</p>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card)', color: 'var(--foreground)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                        {countChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-8">
              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden w-full">
                <Table
                  columns={columns}
                  dataSource={filteredCollections}
                  rowKey="modelName"
                  pagination={{ defaultPageSize: 15, position: ["bottomRight"], showSizeChanger: true }}
                  scroll={{ x: 'max-content' }}
                  className="w-full"
                />
              </div>

              {/* Mobile List */}
              <div className="md:hidden w-full">
                <List
                  dataSource={filteredCollections}
                  pagination={{ pageSize: 15, align: "center", size: "small" }}
                  renderItem={(record) => (
                    <List.Item className="border-none px-0 py-2">
                      <div className="bg-card w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

                        <div className="flex justify-between items-start pl-1">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 flex items-center justify-center">
                              <Server className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-foreground leading-none mb-1 truncate">
                                {record.modelName}
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                                {record.collectionName}
                              </span>
                            </div>
                          </div>

                          <div className="font-bold text-lg whitespace-nowrap text-emerald-500">
                            {formatBytes(record.storageSize)}
                          </div>
                        </div>

                        <div className="pl-1 text-sm flex flex-wrap gap-2 mt-2 border-t pt-3">
                          <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-muted/30 rounded-lg flex-1 min-w-[30%]">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Docs</span>
                            <span className="font-mono font-medium text-foreground">{record.count.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-muted/30 rounded-lg flex-1 min-w-[30%]">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Data Size</span>
                            <span className="font-medium text-foreground">{formatBytes(record.size)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 px-3 py-1.5 bg-muted/30 rounded-lg flex-1 min-w-[30%]">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Avg Object</span>
                            <span className="font-medium text-foreground">{formatBytes(record.avgObjSize)}</span>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          )}
        </MasterViewLayout>
      </div>
    </MasterLayout>
  );
}
