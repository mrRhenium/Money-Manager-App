"use client";

import { useMemo, useTransition, useState } from "react";
import { LoanForm } from "@/components/forms/LoanForm";
import { LoanDeleteModal } from "@/components/forms/LoanDeleteModal";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { payEMI, undoLastEMI } from "@/actions/loan";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, CalendarDays, ArrowUpRight, ArrowDownLeft, RotateCcw } from "lucide-react";
import { List, Modal } from "antd";
import dayjs from "dayjs";
import { formatIndianNumber } from "@/lib/numberHelper";

interface LoanListProps {
  loans: any[];
  accounts: any[];
  hideToolbar?: boolean;
  externalSearch?: string;
  externalSort?: string;
  externalTab?: string;
}

export function LoanList({ 
  loans, 
  accounts,
  hideToolbar = false,
  externalSearch = "",
  externalSort = "date-nearest",
  externalTab = "active"
}: LoanListProps) {
  const { format } = useCurrency();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState<string | null>(null);

  const handlePayEMI = (loanId: string) => {
    setIsPaying(loanId);
    startTransition(async () => {
      try {
        await payEMI(loanId);
        toast.success("EMI paid successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to pay EMI");
      } finally {
        setIsPaying(null);
      }
    });
  };

  const handleUndoEMI = (loanId: string) => {
    Modal.confirm({
      title: 'Undo EMI Payment',
      content: 'Are you sure you want to undo the last EMI payment? This will reverse the transaction and update your account balance.',
      okText: 'Yes, Undo',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        setIsUndoing(loanId);
        startTransition(async () => {
          try {
            await undoLastEMI(loanId);
            toast.success("Last EMI payment successfully reversed!");
          } catch (err: any) {
            toast.error(err.message || "Failed to undo EMI");
          } finally {
            setIsUndoing(null);
          }
        });
      }
    });
  };

  const getDaysUntilEMI = (emiDate: number) => {
    const today = dayjs();
    let targetDate = dayjs().date(emiDate);
    if (targetDate.isBefore(today, 'day')) {
      targetDate = targetDate.add(1, 'month');
    }
    return targetDate.diff(today, 'day');
  };

  const sortLoans = (loanList: any[]) => {
    const sorted = [...loanList];
    switch (externalSort) {
      case "date-nearest":
        return sorted.sort((a, b) => getDaysUntilEMI(a.emiDate) - getDaysUntilEMI(b.emiDate));
      case "date-farthest":
        return sorted.sort((a, b) => getDaysUntilEMI(b.emiDate) - getDaysUntilEMI(a.emiDate));
      case "out-high":
        return sorted.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
      case "out-low":
        return sorted.sort((a, b) => a.outstandingBalance - b.outstandingBalance);
      case "prog-high":
        return sorted.sort((a, b) => (1 - (a.outstandingBalance / a.totalAmount)) - (1 - (b.outstandingBalance / b.totalAmount)));
      case "prog-low":
        return sorted.sort((a, b) => (1 - (b.outstandingBalance / b.totalAmount)) - (1 - (a.outstandingBalance / a.totalAmount)));
      default:
        return sorted;
    }
  };

  const displayedLoans = useMemo(() => {
    const filtered = loans.filter(l => 
      l.status === externalTab && 
      l.name.toLowerCase().includes(externalSearch.toLowerCase())
    );
    return sortLoans(filtered);
  }, [loans, externalSearch, externalSort, externalTab]);

  const renderLoanCard = (loan: any) => {
    const isTaken = loan.type === "taken";
    const amountPaid = loan.totalAmount - loan.outstandingBalance;
    const actualPercentage = (amountPaid / loan.totalAmount) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, actualPercentage));
    const isCompleted = loan.status === "completed";

    // Determine overdue status
    const today = dayjs();
    const isOverdue = !isCompleted && today.date() > loan.emiDate; // Simple check

    const daysUntilNext = getDaysUntilEMI(loan.emiDate);
    let nextEmiDateStr = "";
    if (daysUntilNext === 0) nextEmiDateStr = "Today";
    else if (daysUntilNext === 1) nextEmiDateStr = "Tomorrow";
    else nextEmiDateStr = dayjs().add(daysUntilNext, 'day').format('D MMM YYYY');

    const emisPaid = Math.floor(amountPaid / loan.emiAmount);

    return (
      <List.Item className="h-full !mb-0 block">
        <Card key={loan._id} className="relative overflow-hidden group hover:shadow-md transition-all h-full flex flex-col justify-between border-border/60">
          <CardContent className="p-5 flex flex-col h-full z-10">
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0 text-white"
                style={{ backgroundColor: loan.color }}
              >
                <CategoryIcon name={loan.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate">{loan.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {isTaken ? (
                    <span className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      <ArrowUpRight className="w-3 h-3" /> Loan Taken
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      <ArrowDownLeft className="w-3 h-3" /> Loan Given
                    </span>
                  )}
                  
                  {loan.interestRate !== undefined && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${loan.interestType === 'compound' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {loan.interestRate}% {loan.interestType === 'compound' ? 'COMPOUND' : 'SIMPLE'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 -mt-2 -mr-2 shrink-0">
              <LoanForm accounts={accounts} loan={loan} />
              <LoanDeleteModal loan={loan} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/30 p-3 rounded-xl border shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate mb-1">EMI Amount</p>
              <p className="font-semibold text-sm truncate">{format(loan.emiAmount)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {emisPaid} / {loan.tenureMonths} EMIs paid
              </p>
            </div>
            <div className="bg-secondary/30 p-3 rounded-xl border shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate mb-1">Outstanding</p>
              <p className={`font-bold text-sm truncate ${isTaken ? 'text-red-500' : 'text-emerald-500'}`}>
                {format(loan.outstandingBalance)}
              </p>
              {!isCompleted && (
                <div className="mt-1 flex items-center gap-1 text-[10px]">
                  {isOverdue ? (
                    <span className="text-red-500 font-bold bg-red-50 px-1 rounded flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5"/> OVERDUE</span>
                  ) : (
                    <span className="text-muted-foreground"><CalendarDays className="w-3 h-3 inline mr-1" /> Next: {nextEmiDateStr}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full space-y-3 mt-auto px-1">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Paid / Total Payable</p>
                <p className="text-sm font-semibold">{format(amountPaid)} <span className="text-muted-foreground font-normal">/ {format(loan.totalAmount)}</span></p>
              </div>
              <div className="text-right">
                <span style={{ color: loan.color }} className="font-bold">{actualPercentage.toFixed(1)}%</span>
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mt-1">
                  {isCompleted ? <span className="text-emerald-500">COMPLETED!</span> : `LEFT: ${format(loan.outstandingBalance)}`}
                </p>
              </div>
            </div>
            <Progress value={clampedPercentage} className="h-3" indicatorColor={loan.color} />
          </div>

          {!isCompleted && (
            <div className="flex gap-2 shrink-0 z-10 pt-4 mt-2 border-t">
              <Button
                size="sm"
                onClick={() => handlePayEMI(loan._id)}
                disabled={isPaying === loan._id}
                className="shadow-sm h-8"
              >
                {isPaying === loan._id ? "Processing..." : "Pay EMI"}
              </Button>
              {amountPaid > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUndoEMI(loan._id)}
                  disabled={isUndoing === loan._id}
                  className="shadow-sm h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                  title="Undo last EMI payment"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  {isUndoing === loan._id ? "Reversing..." : "Undo"}
                </Button>
              )}
            </div>
          )}
        </CardContent>

        {/* Decorative background circle */}
        <div 
          className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{ backgroundColor: loan.color }}
        />
        </Card>
      </List.Item>
    );
  };

  if (displayedLoans.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl mt-4">
        No loans in this section.
      </div>
    );
  }

  return (
    <div className="pt-2 pb-4">
      <List
        grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={displayedLoans}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={renderLoanCard}
      />
    </div>
  );
}
