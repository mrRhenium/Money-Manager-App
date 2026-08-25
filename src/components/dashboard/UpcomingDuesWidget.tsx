"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateString, parseToDate, getCurrentDate } from "@/lib/dateTimeHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Calendar, CreditCard, Shield, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  loan_emi: { label: "🏦 Loans (EMIs)", icon: Landmark, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500/10" },
  loan_emi_receive: { label: "🏦 Loans (EMI Receivable)", icon: Landmark, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  credit_card: { label: "💳 Credit Cards", icon: CreditCard, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
  sip: { label: "📈 SIP Investments", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10" },
  insurance: { label: "🛡️ Insurance Premiums", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10" },
  subscription: { label: "🔄 Subscriptions", icon: RefreshCw, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10" },
};

export function UpcomingDuesWidget({ dues, daysAhead = 30 }: { dues: any[], daysAhead?: number }) {
  const { format } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const itemsPerPage = 10;

  if (!dues || dues.length === 0) return null;

  const filteredDues = dues.filter(due => {
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
  const totalAmount = filteredDues.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const paginatedDues = filteredDues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Card className="cursor-pointer border border-blue-500/20 bg-blue-500/5 shadow-sm hover:bg-blue-500/10 transition-all duration-200 h-full">
          <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 h-full">
            <div className="flex items-center sm:items-start gap-2 sm:gap-4 w-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs sm:text-base text-blue-800 dark:text-blue-400 truncate">Upcoming Dues</h3>
                <p className="text-[10px] sm:text-sm text-blue-600 dark:text-blue-500 font-medium truncate sm:whitespace-normal">
                  {dues.length} dues in next {daysAhead} days
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
              <span className="text-[9px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-wider hidden sm:block">Total Amount: </span>
              <div className="font-bold text-sm sm:text-base text-blue-700 dark:text-blue-400">
                {format(totalAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
      } />

      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Dues
            </DialogTitle>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, amount, date, or type..."
                className="pl-9 bg-background w-full h-9"
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
              <SelectTrigger className="w-full sm:w-[220px] h-9 shrink-0 bg-background text-foreground">
                <SelectValue placeholder="All Categories" />
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

        {/* Grouped by category */}
        <div className="space-y-6 mt-4">
          {groupedDues.map(([type, items]) => {
            const config = CATEGORY_CONFIG[type] || { label: type, icon: Calendar, color: "text-muted-foreground", bgColor: "bg-secondary" };
            const CategoryIcon = config.icon;
            const groupTotal = items.reduce((acc: number, d: any) => acc + d.amount, 0);

            return (
              <div key={type}>
                {/* Category Header */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${config.bgColor} mb-2`}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                    <Badge variant="outline" className="text-[10px] h-5 ml-1">{items.length}</Badge>
                  </div>
                  <span className={`text-sm font-bold ${config.color}`}>{format(groupTotal)}</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border/50">
                  {items.map((due: any, idx: number) => {
                    const isOverdue = parseToDate(due.dueDate) < getCurrentDate();

                    return (
                      <div key={idx} className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 transition-colors rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bgColor} ${config.color}`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm truncate">{due.title}</h4>
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                              <CalendarDays className="w-3 h-3 text-muted-foreground" />
                              <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                                Due: {formatDateString(due.dueDate, "DD-MM-YYYY")}
                              </span>
                              {isOverdue && <AlertCircle className="w-3 h-3 text-destructive" />}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-sm">{format(due.amount)}</div>
                          </div>
                          <Button size="sm" variant={isOverdue ? "destructive" : "secondary"} className="h-8 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Pay
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
