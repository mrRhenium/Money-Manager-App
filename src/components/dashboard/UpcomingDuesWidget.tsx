"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateString, parseToDate, getCurrentDate } from "@/lib/dateTimeHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Calendar, CreditCard, Shield, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function UpcomingDuesWidget({ dues, daysAhead = 30 }: { dues: any[], daysAhead?: number }) {
  const { format } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  if (!dues || dues.length === 0) return null;

  
  const filteredDues = dues.filter(due => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Card className="cursor-pointer border border-blue-500/20 bg-blue-500/5 shadow-sm hover:bg-blue-500/10 transition-all duration-200 h-full">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-blue-800 dark:text-blue-400">Upcoming Dues</h3>
                <p className="text-sm text-blue-600 dark:text-blue-500 font-medium">
                  {dues.length} dues in next {daysAhead} days
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block sm:inline">Total Amount: </span>
              <div className="font-bold text-base text-blue-700 dark:text-blue-400 flex items-center justify-start sm:justify-end">
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
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, amount, date, or type..."
              className="pl-9 bg-background w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </DialogHeader>
        <div className="divide-y divide-border/50">
          {paginatedDues.map((due: any, idx: number) => {
            const isOverdue = parseToDate(due.dueDate) < getCurrentDate();
            let Icon = Calendar;
            let iconColor = "text-muted-foreground";

            if (due.type === "credit_card") { Icon = CreditCard; iconColor = "text-blue-500"; }
            if (due.type === "insurance") { Icon = Shield; iconColor = "text-emerald-500"; }
            if (due.type === "sip") { Icon = TrendingUp; iconColor = "text-purple-500"; }
            if (due.type === "subscription") { Icon = RefreshCw; iconColor = "text-amber-500"; }

            return (
              <div key={idx} className="flex items-center justify-between py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-secondary shrink-0 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{due.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Due: {formatDateString(due.dueDate, "DD-MM-YYYY")}
                      </span>
                      {isOverdue && <AlertCircle className="w-3 h-3 text-destructive" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-sm">{format(due.amount)}</div>
                    <div className="text-xs text-muted-foreground uppercase">{due.type}</div>
                  </div>
                  <Button size="sm" variant={isOverdue ? "destructive" : "secondary"} className="h-8 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Pay
                  </Button>
                </div>
              </div>
            );
          })}
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
