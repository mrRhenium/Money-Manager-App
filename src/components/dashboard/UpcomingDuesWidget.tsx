"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateString, parseToDate, getCurrentDate } from "@/lib/dateTimeHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Calendar, CreditCard, Shield, TrendingUp, RefreshCw, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayDueModal, DueItem } from "./PayDueModal";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  loan_emi: { label: "Loans (EMIs)", icon: Landmark, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10" },
  loan_emi_receive: { label: "Loans (EMI Receivable)", icon: Landmark, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  credit_card: { label: "Credit Cards", icon: CreditCard, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
  sip: { label: "SIP Investments", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10" },
  insurance: { label: "Insurance Premiums", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  subscription: { label: "Subscriptions", icon: RefreshCw, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
};

function getDaysRemaining(dueDate: any): number {
  if (!dueDate) return 0;
  const now = getCurrentDate();
  now.setHours(0, 0, 0, 0);
  const target = parseToDate(dueDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function UpcomingDuesWidget({ dues, daysAhead = 30, accounts = [] }: { dues: any[], daysAhead?: number, accounts?: any[] }) {
  const { format } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDue, setSelectedDue] = useState<DueItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const itemsPerPage = 10;

  const filteredDues = useMemo(() => {
    if (!dues || dues.length === 0) return [];
    return dues.filter(due => {
      if (selectedCategory !== "all" && due.type !== selectedCategory) return false;
      if (!searchQuery) return true;
      const s = searchQuery.toLowerCase();
      const dateStr = formatDateString(due.dueDate, "DD-MM-YYYY");
      return (
        (due.title || "").toLowerCase().includes(s) ||
        (due.type || "").toLowerCase().includes(s) ||
        due.amount.toString().includes(s) ||
        dateStr.includes(s)
      );
    });
  }, [dues, selectedCategory, searchQuery]);

  const totalAmount = useMemo(() => filteredDues.reduce((acc, curr) => acc + curr.amount, 0), [filteredDues]);
  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const paginatedDues = useMemo(() => filteredDues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredDues, currentPage, itemsPerPage]);

  // Group paginatedDues by type for categorized display
  const groupedDues = useMemo(() => {
    const groups: Record<string, any[]> = {};
    paginatedDues.forEach(due => {
      const key = due.type || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(due);
    });
    // Sort groups by predefined order
    const order = ["loan_emi", "loan_emi_receive", "credit_card", "sip", "insurance", "subscription"];
    const sorted: [string, any[]][] = [];
    order.forEach(key => { if (groups[key]) sorted.push([key, groups[key]]); });
    Object.keys(groups).forEach(key => { if (!order.includes(key)) sorted.push([key, groups[key]]); });
    return sorted;
  }, [paginatedDues]);

  if (!dues || dues.length === 0) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Card className="cursor-pointer border border-blue-500/20 bg-blue-500/5 shadow-sm hover:bg-blue-500/10 transition-all duration-200 h-full">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-4 h-full">
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm sm:text-base text-blue-800 dark:text-blue-400 truncate">Upcoming Dues</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-0.5">
                    {dues.length} dues in next {daysAhead} days
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-wider block">Total Amount:</span>
                <div className="font-bold text-base sm:text-lg text-blue-700 dark:text-blue-400">
                  {format(totalAmount)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      } />

      <DialogContent initialFocus={false} size="lg">
        <DialogHeader className="gap-2.5">
          <div className="flex items-center justify-between gap-3 pr-8 sm:pr-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate">
                  Upcoming Dues
                </DialogTitle>
                <DialogDescription className="truncate">
                  {dues.length} {dues.length === 1 ? "due" : "dues"} • Total {format(totalAmount)}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 hidden sm:inline-flex">
              {format(totalAmount)}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, amount, date..."
                className="pl-9 bg-background w-full h-9 text-xs sm:text-sm rounded-xl border-border/60"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val || "all");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-9 shrink-0 bg-background text-foreground text-xs sm:text-sm rounded-xl border-border/60">
                <SelectValue placeholder="All Categories">
                  {selectedCategory === "all" ? "All Categories" : CATEGORY_CONFIG[selectedCategory]?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <DialogBody className="space-y-3.5 sm:space-y-4">
          {groupedDues.map(([type, items]) => {
            const config = CATEGORY_CONFIG[type] || { label: type, icon: Calendar, color: "text-muted-foreground", bgColor: "bg-secondary" };
            const CategoryIcon = config.icon;
            const groupTotal = items.reduce((acc: number, d: any) => acc + d.amount, 0);

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md ${config.bgColor} ${config.color}`}>
                      <CategoryIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{format(groupTotal)}</span>
                </div>

                <div className="flex flex-col gap-2 w-full min-w-0">
                  {items.map((due: DueItem) => {
                    const days = due.daysRemaining !== undefined ? due.daysRemaining : getDaysRemaining(due.dueDate);
                    const isOverdue = days < 0;
                    const isToday = days === 0;

                    return (
                      <div
                        key={due.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col gap-2 w-full min-w-0 ${
                          isOverdue
                            ? "bg-red-500/5 border-red-500/20"
                            : isToday
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-card hover:bg-muted/30 border-border/60 shadow-2xs"
                        }`}
                      >
                        {/* Top Row: Title + Amount */}
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1 pr-1">
                            <h4 className={cn(TYPOGRAPHY.cardTitle, "leading-snug break-words")} title={due.title}>
                              {due.title}
                            </h4>
                            {due.subtitle && (
                              <p className={cn(TYPOGRAPHY.cardSubtitle, "mt-0.5")}>
                                {due.subtitle}
                              </p>
                            )}
                          </div>
                          <span className={cn(TYPOGRAPHY.cardAmount, "shrink-0 text-right whitespace-nowrap")}>
                            {format(due.amount)}
                          </span>
                        </div>

                        {/* Bottom Row: Due Date countdown + Action Button */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                          <div className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5 normal-case font-normal min-w-0 flex-1")}>
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            <span className="shrink-0">{formatDateString(due.dueDate, "DD MMM YYYY")}</span>
                            <span>•</span>
                            <span className={cn(TYPOGRAPHY.badge, isOverdue ? "text-red-500 bg-red-500/10" : isToday ? "text-amber-500 bg-amber-500/10" : "text-primary bg-primary/10")}>
                              {isOverdue 
                                ? `${Math.abs(days)}d overdue` 
                                : isToday 
                                ? "Due today" 
                                : `in ${days} day${days === 1 ? "" : "s"}`}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant={isOverdue ? "destructive" : "default"}
                            className={cn("h-7 sm:h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0", TYPOGRAPHY.modalButton)}
                            onClick={() => {
                              setSelectedDue(due);
                              setIsPayModalOpen(true);
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{due.type === "loan_emi_receive" ? "Receive" : "Pay"}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredDues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No dues match your search.</div>
          )}
        </DialogBody>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <DialogFooter className="flex-row items-center justify-between w-full">
            <span className="text-xs text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    <PayDueModal
      open={isPayModalOpen}
      onOpenChange={setIsPayModalOpen}
      due={selectedDue}
      accounts={accounts}
      onSuccess={() => {
        setIsPayModalOpen(false);
        setIsOpen(false);
      }}
    />
  </>
);
}
