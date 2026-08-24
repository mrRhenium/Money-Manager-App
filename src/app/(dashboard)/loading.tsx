"use client";

import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterViewLayout } from "@/components/layout/MasterView";

export default function DashboardLoading() {
  return (
    <MasterLayout>
      <MasterHeader 
        title={<div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />}
        subtitle={<div className="h-5 w-72 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mt-2" />}
      />

      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
        
        {/* Skeleton Toolbar Row */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>

        <MasterViewLayout sidebar={
          <div className="space-y-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        }>
          <div className="pb-24 pt-4 space-y-3">
            {/* List Skeleton */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-card">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </MasterViewLayout>

      </div>
    </MasterLayout>
  );
}
