"use client";

import { useState } from "react";
import { LoanForm } from "@/components/forms/LoanForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { payEMI, deleteLoan } from "@/actions/loan";
import { useToast } from "@/hooks/useToast";
import { Trash2, AlertCircle, CheckCircle2, ChevronRight, ArrowUpRight, ArrowDownLeft, PenLine } from "lucide-react";

export function LoanClient({ loans, accounts }: { loans: any[], accounts: any[] }) {
  const { format } = useCurrency();
  const { toast } = useToast();
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const handlePayEMI = async (loanId: string) => {
    setIsPaying(loanId);
    try {
      await payEMI(loanId);
      toast.success("EMI paid successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to pay EMI");
    } finally {
      setIsPaying(null);
    }
  };

  const handleDelete = async (loanId: string) => {
    if (confirm("Are you sure you want to delete this loan record? This cannot be undone.")) {
      try {
        await deleteLoan(loanId);
        toast.success("Loan deleted");
      } catch (err: any) {
        toast.error("Failed to delete loan");
      }
    }
  };

  const activeLoans = loans.filter(l => l.status === "active");
  const completedLoans = loans.filter(l => l.status === "completed");

  const totalLiabilities = activeLoans.filter(l => l.type === "taken").reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalAssets = activeLoans.filter(l => l.type === "given").reduce((sum, l) => sum + l.outstandingBalance, 0);

  const renderLoanCard = (loan: any) => {
    const isTaken = loan.type === "taken";
    const amountPaid = loan.totalAmount - loan.outstandingBalance;
    const actualPercentage = (amountPaid / loan.totalAmount) * 100;
    const clampedPercentage = Math.min(100, Math.max(0, actualPercentage));

    return (
      <Card key={loan._id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className={`absolute top-0 left-0 w-1.5 h-full`} style={{ backgroundColor: loan.color }} />
        <CardContent className="p-5 pl-6">
          <div className="flex justify-between items-start mb-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                style={{ backgroundColor: `${loan.color}20`, color: loan.color }}
              >
                <CategoryIcon name={loan.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">{loan.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  {isTaken ? (
                    <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider whitespace-nowrap text-[10px]">
                      <ArrowUpRight className="w-3 h-3" /> Loan Taken
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider whitespace-nowrap text-[10px]">
                      <ArrowDownLeft className="w-3 h-3" /> Loan Given
                    </span>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                  <span className="whitespace-nowrap">EMI on {loan.emiDate}th</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 -mt-2 -mr-2">
              {loan.status === "active" && (
                <Button 
                  size="sm" 
                  onClick={() => handlePayEMI(loan._id)}
                  disabled={isPaying === loan._id}
                  className="flex shadow-sm h-8 mr-1"
                >
                  {isPaying === loan._id ? "Processing..." : "Pay EMI"}
                </Button>
              )}
              <LoanForm accounts={accounts} loan={loan} />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(loan._id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 bg-secondary/30 p-3 rounded-xl border shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate mb-1">EMI Amount</p>
              <p className="font-semibold text-sm truncate">{format(loan.emiAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate mb-1">Outstanding</p>
              <p className={`font-bold text-sm truncate ${isTaken ? 'text-red-500' : 'text-emerald-500'}`}>
                {format(loan.outstandingBalance)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate mb-1">Total Paid</p>
              <p className="font-semibold text-sm truncate text-foreground">{format(amountPaid)}</p>
            </div>
          </div>

          <div className="w-full space-y-3 mt-4 px-1">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Paid / Total</p>
                <p className="text-sm font-semibold">{format(amountPaid)} <span className="text-muted-foreground font-normal">/ {format(loan.totalAmount)}</span></p>
              </div>
              <div className="text-right">
                <span style={{ color: loan.color }} className="font-bold">{actualPercentage.toFixed(1)}%</span>
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mt-1">
                  LEFT: {format(loan.outstandingBalance)}
                </p>
              </div>
            </div>
            <Progress value={clampedPercentage} className="h-3" indicatorColor={loan.color} />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Total Liabilities (Taken)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {format(totalLiabilities)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Total Assets (Given)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {format(totalAssets)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" /> Active Loans
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {activeLoans.map(renderLoanCard)}
        {activeLoans.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/20 border border-dashed rounded-xl">
            <p className="text-muted-foreground">No active loans found.</p>
          </div>
        )}
      </div>

      {completedLoans.length > 0 && (
        <>
          <h2 className="text-xl font-bold flex items-center gap-2 pt-6">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completed Loans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 opacity-75">
            {completedLoans.map(renderLoanCard)}
          </div>
        </>
      )}
    </div>
  );
}
