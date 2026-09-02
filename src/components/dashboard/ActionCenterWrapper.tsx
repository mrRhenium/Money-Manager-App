"use client";

import React, { useState, useEffect, Suspense } from "react";
import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";
import { UpcomingDuesWidget } from "@/components/dashboard/UpcomingDuesWidget";
import { BellDot, X, Users, Filter, CheckCircle2, ShieldAlert, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";
import { DashboardAdvancedFilter } from "@/components/dashboard/DashboardAdvancedFilter";
import { MasterFilterDrawer } from "@/components/layout/MasterView";
import { Drawer } from "antd";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { getPendingTransactions } from "@/actions/transaction";

export function ActionCenterWrapper({ 
  upcomingDues = [], 
  daysAhead = 7, 
  user, 
  accounts = [],
  filterSummary = "Last 7 Days",
  isFilterActive = false,
}: { 
  upcomingDues: any[]; 
  daysAhead: number; 
  user: any; 
  accounts?: any[]; 
  filterSummary?: string;
  isFilterActive?: boolean;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync initial pending count for the header bell badge
  useEffect(() => {
    getPendingTransactions().then((txns) => {
      if (Array.isArray(txns)) setPendingCount(txns.length);
    }).catch(console.error);
  }, []);

  const totalActions = pendingCount + upcomingDues.length;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header Area */}
      <div className="flex flex-col gap-4 bg-transparent lg:bg-gradient-to-r from-primary/10 via-primary/5 to-transparent lg:p-6 lg:rounded-2xl lg:border border-primary/10">
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/settings" 
              className="w-12 h-12 min-[400px]:w-14 min-[400px]:h-14 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-primary/20 border-2 border-background shadow-sm shrink-0 flex lg:hidden items-center justify-center hover:opacity-80 transition-opacity"
            >
              {user?.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-6 h-6 min-[400px]:w-7 min-[400px]:h-7 sm:w-7 sm:h-7 text-primary" />
              )}
            </Link>
            <div>
              <h1 className={cn(TYPOGRAPHY.headerTitle, "truncate max-w-[200px] sm:max-w-none")}>
                Welcome, {user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className={cn(TYPOGRAPHY.headerSubtitle, "mt-0.5 block")}>
                Here&apos;s your actionable financial overview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DashboardScanTrigger />

            {/* Mobile Filter Button */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setFilterOpen(true)} 
              className={cn(
                "lg:hidden rounded-full relative shadow-sm bg-background/80 backdrop-blur text-foreground border-border/50 hover:bg-muted h-9 w-9 transition-all cursor-pointer",
                isFilterActive && "border-primary/60 text-primary bg-primary/10 hover:bg-primary/15"
              )}
              title="Filters & Date Range"
            >
              <Filter className="w-4 h-4" />
              {isFilterActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Button>
            <MasterFilterDrawer
              isOpen={filterOpen}
              onClose={() => setFilterOpen(false)}
              isFilterActive={isFilterActive}
              onClearFilters={() => {
                router.push("/");
                setFilterOpen(false);
              }}
            >
              <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                <Suspense fallback={<div className="h-10 w-full animate-pulse bg-muted rounded-full"></div>}>
                  <DashboardAdvancedFilter />
                </Suspense>
              </div>
            </MasterFilterDrawer>

            {/* Action Center Right Drawer Trigger (Bell Icon + Badge) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "rounded-full relative shadow-sm bg-background/80 backdrop-blur border-border/50 hover:bg-muted h-9 w-9 sm:h-11 sm:w-11 transition-all cursor-pointer",
                totalActions > 0 && "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
              )}
              title="Notifications & Action Center"
            >
              <BellDot className={cn("w-4 h-4 sm:w-5 sm:h-5", totalActions > 0 && "animate-pulse")} />
              {totalActions > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold border-2 border-background shadow-xs">
                  {totalActions > 9 ? "9+" : totalActions}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Active Filter Status Bar */}
        <div className="flex lg:hidden items-center justify-between gap-2 pt-1.5 border-t border-border/40 mt-0.5">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs min-w-0 max-w-full active:scale-98",
              isFilterActive 
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15" 
                : "bg-secondary/70 text-foreground border-border/60 hover:bg-secondary"
            )}
            title="Tap to change filter"
          >
            <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate font-medium text-muted-foreground text-[11px]">Filter:</span>
            <span className="truncate font-bold">{filterSummary}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-bold ml-1 shrink-0">
              Edit
            </span>
          </button>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground font-medium shrink-0 rounded-md hover:bg-muted"
            >
              Reset (7d)
            </Button>
          )}
        </div>

        {/* Desktop Filter Row */}
        <div className="hidden lg:flex justify-end pt-2">
          <Suspense fallback={<div className="h-10 w-48 animate-pulse bg-muted rounded-full"></div>}>
            <DashboardAdvancedFilter />
          </Suspense>
        </div>
      </div>

      {/* ── ACTION CENTER RIGHT-SIDE DRAWER (Slides in from right, zero layout shift) ── */}
      <Drawer
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 460}
        zIndex={1000}
        closable={false}
        extra={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(false)}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        }
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
              <BellDot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(TYPOGRAPHY.sectionTitle, "font-bold tracking-tight text-foreground")}>Action Center</span>
                {totalActions > 0 ? (
                  <span className={cn(TYPOGRAPHY.badge, "font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30")}>
                    {totalActions} Pending
                  </span>
                ) : (
                  <span className={cn(TYPOGRAPHY.badge, "font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30")}>
                    All Clear
                  </span>
                )}
              </div>
              <p className={cn(TYPOGRAPHY.cardSubtitle, "font-normal mt-0.5")}>
                Urgent financial tasks, approvals & bill reminders
              </p>
            </div>
          </div>
        }
        classNames={{
          body: "bg-card text-foreground custom-scrollbar",
          header: "bg-card text-foreground border-b border-border/40",
          content: "bg-card text-foreground border-l border-border/40"
        }}
        styles={{
          header: {
            padding: "14px 16px",
            borderBottom: "1px solid hsl(var(--border-hsl) / 0.4)",
            background: "linear-gradient(to bottom, hsl(var(--muted-hsl) / 0.3), transparent)"
          },
          body: { padding: "16px" }
        }}
      >
        <div className="flex flex-col gap-5 pb-8">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span className={cn(TYPOGRAPHY.cardLabel, "uppercase tracking-wider font-bold")}>UPI Approvals</span>
              </div>
              <span className={cn(TYPOGRAPHY.cardAmount, "font-bold text-foreground mt-1.5")}>{pendingCount}</span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className={cn(TYPOGRAPHY.cardLabel, "uppercase tracking-wider font-bold")}>Upcoming Dues</span>
              </div>
              <span className={cn(TYPOGRAPHY.cardAmount, "font-bold text-foreground mt-1.5")}>{upcomingDues.length}</span>
            </div>
          </div>

          {totalActions > 0 ? (
            <div className="space-y-4">
              {/* Section 1: Pending Confirmations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(TYPOGRAPHY.cardLabel, "uppercase tracking-wider text-muted-foreground flex items-center gap-1.5")}>
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending UPI Confirmations
                  </span>
                  <span className={cn(TYPOGRAPHY.cardSubtitle, "font-semibold text-amber-600 dark:text-amber-400")}>
                    {pendingCount} waiting
                  </span>
                </div>
                <PendingConfirmationsWidget onCountChange={setPendingCount} />
              </div>

              {/* Section 2: Upcoming Dues */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(TYPOGRAPHY.cardLabel, "uppercase tracking-wider text-muted-foreground flex items-center gap-1.5")}>
                    <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Upcoming Bills & Dues ({daysAhead} Days)
                  </span>
                  <span className={cn(TYPOGRAPHY.cardSubtitle, "font-semibold text-blue-600 dark:text-blue-400")}>
                    {upcomingDues.length} upcoming
                  </span>
                </div>
                <UpcomingDuesWidget dues={upcomingDues} daysAhead={daysAhead} accounts={accounts} />
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className={cn(TYPOGRAPHY.cardTitle, "font-bold text-foreground")}>You&apos;re All Caught Up!</h4>
              <p className={cn(TYPOGRAPHY.cardSubtitle, "max-w-xs mx-auto mt-1.5 leading-relaxed text-muted-foreground")}>
                No pending UPI transactions require confirmation, and no upcoming dues are scheduled within the next {daysAhead} days.
              </p>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
