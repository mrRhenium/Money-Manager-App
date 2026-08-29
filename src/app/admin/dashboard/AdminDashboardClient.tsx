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
      {/* 1. Full-Width Database Storage KPI Card at Top */}
      <div className="w-full p-4 sm:p-6 rounded-2xl border bg-gradient-to-br from-card via-card to-purple-500/5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground">Database Storage</h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MongoDB Atlas
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Primary cluster storage usage and tier allocation limit</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 sm:self-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{formatBytes(stats.dbSize || 0)}</span>
            <span className="text-xs font-medium text-muted-foreground">/ 512 MB Free Tier</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Storage Capacity</span>
            <span className="font-semibold text-foreground">
              {((stats.dbSize || 0) / 536870912 * 100).toFixed(2)}% Used
            </span>
          </div>
          <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-border/40">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(1, Math.min(((stats.dbSize || 0) / 536870912) * 100, 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 3-Column KPI Grid for Mobile & Desktop */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Users */}
        <div className="p-3 sm:p-5 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 pb-1 sm:pb-2">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">Total Users</h3>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-base sm:text-2xl md:text-3xl font-extrabold text-foreground truncate mt-1">
            {stats.totalUsers}
          </div>
        </div>

        {/* Active Users */}
        <div className="p-3 sm:p-5 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 pb-1 sm:pb-2">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">Active Users</h3>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-base sm:text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate mt-1">
            {stats.activeUsers}
          </div>
        </div>

        {/* Inactive Users */}
        <div className="p-3 sm:p-5 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 pb-1 sm:pb-2">
            <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">Inactive Users</h3>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            </div>
          </div>
          <div className="text-base sm:text-2xl md:text-3xl font-extrabold text-red-500 truncate mt-1">
            {stats.inactiveUsers}
          </div>
        </div>
      </div>

      {/* 3. Registrations Chart and Secondary Cards */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Registration Chart */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">User Registrations (Last 6 Months)</h3>
          <div className="h-[260px] sm:h-[300px] w-full">
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

        {/* Side Cards: Global Transactions & Supported Currencies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Global Transactions */}
          <div className="p-4 sm:p-6 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Global Transactions</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total platform volume</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold mt-3">{stats.totalTransactions}</div>
          </div>

          {/* Supported Currencies */}
          <div className="p-4 sm:p-6 rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Supported Currencies</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Active multi-currency rates</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-3">{stats.totalCurrencies}</div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Platform Health</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All systems normal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
