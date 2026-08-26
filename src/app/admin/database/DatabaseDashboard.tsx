"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Database, HardDrive, LayoutList, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

  const storageChartData = useMemo(() => {
    // Filter out empty collections to make chart cleaner
    const active = collections.filter(c => c.storageSize > 0);
    return active.map((c, i) => ({
      name: c.modelName,
      value: c.storageSize,
      formatted: formatBytes(c.storageSize)
    }));
  }, [collections]);

  const countChartData = useMemo(() => {
    return collections
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 by count
      .map(c => ({
        name: c.modelName,
        count: c.count
      }));
  }, [collections]);

  return (
    <div className="space-y-6">
      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Storage Size
            </CardTitle>
            <HardDrive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(global.storageSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data: {formatBytes(global.dataSize)} | Index: {formatBytes(global.indexSize)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{global.objectsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Object Size: {formatBytes(global.avgObjSize)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collections
            </CardTitle>
            <LayoutList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{global.collectionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered Models: {collections.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Database Name
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={global.dbName}>{global.dbName}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Indexes: {global.indexesCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-primary/10">
          <CardHeader>
            <CardTitle>Storage Distribution</CardTitle>
            <CardDescription>Storage size percentage by collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {storageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatBytes(Number(value))}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-primary/10">
          <CardHeader>
            <CardTitle>Top Collections by Document Count</CardTitle>
            <CardDescription>Most populated models in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {countChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Table */}
      <Card className="bg-card/50 backdrop-blur-xl border-primary/10 overflow-hidden">
        <CardHeader>
          <CardTitle>Collection Breakdown</CardTitle>
          <CardDescription>Detailed metrics for every registered model</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Model Name</th>
                <th className="px-6 py-4 font-medium">Collection</th>
                <th className="px-6 py-4 font-medium text-right">Documents</th>
                <th className="px-6 py-4 font-medium text-right">Data Size</th>
                <th className="px-6 py-4 font-medium text-right">Storage Size</th>
                <th className="px-6 py-4 font-medium text-right">Avg Object</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections.map((col) => (
                <tr key={col.modelName} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{col.modelName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{col.collectionName}</td>
                  <td className="px-6 py-4 text-right font-mono">{col.count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{formatBytes(col.size)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatBytes(col.storageSize)}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{formatBytes(col.avgObjSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
