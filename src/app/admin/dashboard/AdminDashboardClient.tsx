"use client";

import React from "react";
import { Users, Banknote, UserCheck, UserX, Activity, Database } from "lucide-react";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export function AdminDashboardClient({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Total Users */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalUsers}</div>
        </div>

        {/* Active Users */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.activeUsers}</div>
        </div>

        {/* Inactive Users */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Inactive Users</h3>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <UserX className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.inactiveUsers}</div>
        </div>

        {/* Total Transactions */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Global Transactions</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalTransactions}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Registration Chart */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">User Registrations (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            {stats.userRegistrationsByMonth && stats.userRegistrationsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.userRegistrationsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#888888" }} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#888888" }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No registration data available for the last 6 months.
              </div>
            )}
          </div>
        </div>

        {/* Side Cards */}
        <div className="flex flex-col gap-4">
          {/* Currency Card */}
          <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Supported Currencies</h3>
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              <div className="text-4xl font-bold mt-4">{stats.totalCurrencies}</div>
              <p className="text-sm text-muted-foreground mt-2">Active currencies available for users across the platform.</p>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-2">Platform Health</h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">All systems operational</span>
              </div>
            </div>
          </div>

          {/* Database Storage Card */}
          <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Database Storage</h3>
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <div className="text-4xl font-bold mt-4">{formatBytes(stats.dbSize || 0)}</div>
              <p className="text-sm text-muted-foreground mt-2">Consumed out of 512MB free tier limit.</p>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(((stats.dbSize || 0) / 536870912) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right">{((stats.dbSize || 0) / 536870912 * 100).toFixed(2)}% Used</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
