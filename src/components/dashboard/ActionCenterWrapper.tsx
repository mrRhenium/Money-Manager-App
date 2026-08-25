"use client";

import React, { useState } from "react";
import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";
import { UpcomingDuesWidget } from "@/components/dashboard/UpcomingDuesWidget";
import { BellDot, X, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";
import { DashboardAdvancedFilter } from "@/components/dashboard/DashboardAdvancedFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Suspense } from "react";

export function ActionCenterWrapper({ upcomingDues, daysAhead, user }: { upcomingDues: any[], daysAhead: number, user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const totalActions = pendingCount + upcomingDues.length;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header Area */}
      <div className="flex flex-col gap-4 bg-transparent md:bg-gradient-to-r from-primary/10 via-primary/5 to-transparent md:p-6 md:rounded-2xl md:border border-primary/10">
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/settings" className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-primary/20 border-2 border-background shadow-sm shrink-0 flex md:hidden items-center justify-center hover:opacity-80 transition-opacity">
              {user?.image ? (
                <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              )}
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-[150px] sm:max-w-none">
                Welcome, {user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-base block">
                Here's your actionable financial overview.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <DashboardScanTrigger />

            {/* Mobile Filter Button */}
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger render={
                <Button variant="outline" size="icon" className="md:hidden rounded-full shadow-sm bg-background/80 backdrop-blur text-foreground border-border/50 hover:bg-muted h-9 w-9 transition-all">
                  <Filter className="w-4 h-4" />
                </Button>
              } />
              <DialogContent className="!fixed !top-0 !right-0 !bottom-0 !left-auto !translate-x-0 !translate-y-0 w-[85vw] max-w-[340px] rounded-none shadow-2xl p-6 overflow-y-auto flex flex-col gap-6 !data-[state=closed]:slide-out-to-right !data-[state=open]:slide-in-from-right duration-300">
                <DialogHeader className="text-left shrink-0">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" /> Filter Options
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
                  <Suspense fallback={<div className="h-10 w-full animate-pulse bg-muted rounded-full"></div>}>
                    <DashboardAdvancedFilter />
                  </Suspense>
                </div>
              </DialogContent>
            </Dialog>

            {/* Action Center Button (Icon + Badge only) */}
            {totalActions > 0 && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full relative shadow-sm bg-background/80 backdrop-blur border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-9 w-9 sm:h-11 sm:w-11 transition-all"
              >
                {isOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <BellDot className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />}
                {!isOpen && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold border-2 border-background">
                    {totalActions}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Filter Row */}
        <div className="hidden md:flex justify-end pt-2">
          <Suspense fallback={<div className="h-10 w-48 animate-pulse bg-muted rounded-full"></div>}>
            <DashboardAdvancedFilter />
          </Suspense>
        </div>
      </div>

      {/* Action Center Content */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full transition-all duration-300 ${isOpen ? 'block animate-in fade-in slide-in-from-top-4' : 'hidden'}`}>
        <PendingConfirmationsWidget onCountChange={setPendingCount} />
        <UpcomingDuesWidget dues={upcomingDues} daysAhead={daysAhead} />
      </div>
    </div>
  );
}
