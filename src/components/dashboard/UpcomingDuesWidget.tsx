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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayDueModal, DueItem } from "./PayDueModal";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  loan_emi: { label: "🏦 Loans (EMIs)", icon: Landmark, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10" },
  loan_emi_receive: { label: "🏦 Loans (EMI Receivable)", icon: Landmark, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  credit_card: { label: "💳 Credit Cards", icon: CreditCard, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
  sip: { label: "📈 SIP Investments", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10" },
  insurance: { label: "🛡️ Insurance Premiums", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  subscription: { label: "🔄 Subscriptions", icon: RefreshCw, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
};

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

      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border/70 shadow-2xl bg-background">
        <DialogHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20 shrink-0 gap-3 text-left">
          <div className="flex items-center justify-between gap-3 pr-8 sm:pr-10">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span>Upcoming Dues</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg shrink-0">
                {dues.length} {dues.length === 1 ? "Due" : "Dues"}
              </Badge>
              <span className="font-bold text-xs sm:text-sm text-foreground shrink-0">{format(totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
              <SelectTrigger className="w-full sm:w-[210px] h-9 shrink-0 bg-background text-foreground text-xs sm:text-sm rounded-xl border-border/60">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar min-h-0">
          {groupedDues.map(([type, items]) => {
            const config = CATEGORY_CONFIG[type] || { label: type, icon: Calendar, color: "text-muted-foreground", bgColor: "bg-secondary" };
            const CategoryIcon = config.icon;
            const groupTotal = items.reduce((acc: number, d: any) => acc + d.amount, 0);

            return (
              <div key={type} className="min-w-0 space-y-2">
                {/* Category Header */}
                <div className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl ${config.bgColor} min-w-0 gap-2 border border-border/20`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <CategoryIcon className={`w-4 h-4 shrink-0 ${config.color}`} />
                    <span className={`text-xs sm:text-sm font-bold truncate ${config.color}`}>{config.label}</span>
                    <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 shrink-0 font-semibold bg-background/50">{items.length}</Badge>
                  </div>
                  <span className={`text-xs sm:text-sm font-bold shrink-0 ${config.color}`}>{format(groupTotal)}</span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {items.map((due: any, idx: number) => {
                    const isOverdue = parseToDate(due.dueDate) < getCurrentDate();

                    return (
                      <div 
                        key={idx} 
                        className="p-2.5 sm:p-3 hover:bg-muted/50 transition-colors rounded-xl border border-border/50 bg-card flex items-center justify-between gap-3 min-w-0 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${config.bgColor} ${config.color}`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground leading-snug" title={due.title}>
                              {due.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-semibold" : ""}`}>
                                <CalendarDays className="w-3 h-3 shrink-0" />
                                Due: {formatDateString(due.dueDate, "DD-MM-YYYY")}
                              </span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 min-w-[72px] sm:min-w-[85px]">
                          <span className="font-bold text-xs sm:text-sm text-foreground whitespace-nowrap text-right">
                            {format(due.amount)}
                          </span>
                          <Button 
                            size="sm" 
                            variant={isOverdue ? "destructive" : "default"} 
                            className="h-6 sm:h-7 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg shadow-2xs cursor-pointer gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDue(due);
                              setIsPayModalOpen(true);
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
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
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-t border-border/60 bg-muted/20 shrink-0">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
