"use client";

import React, { useState, useEffect } from "react";
import { getPendingTransactions, confirmTransaction } from "@/actions/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateString } from "@/lib/dateTimeHelper";
import { useToast } from "@/hooks/useToast";
import { Smartphone, Check, X, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY } from "@/lib/designTokens";

export function PendingConfirmationsWidget({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { format, currencyCode } = useCurrency();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [pendingTxns, setPendingTxns] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 10;

  const fetchPending = async () => {
    if (!session?.user?.id) return;
    try {
      const txns = await getPendingTransactions();
      setPendingTxns(txns);
      if (onCountChange) onCountChange(txns.length);
    } catch (e) {
      console.error("Failed to load pending confirmations", e);
    }
  };

  useEffect(() => {
    fetchPending();

    // Periodically update or fetch on focus
    const interval = setInterval(fetchPending, 15000);
    window.addEventListener("focus", fetchPending);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchPending);
    };
  }, [session]);

  useEffect(() => {
    if (pendingTxns.length === 0) {
      setIsModalOpen(false);
    }
  }, [pendingTxns]);

  const handleResolve = async (id: string, status: "completed" | "cancelled" | "pending") => {
    try {
      setLoadingId(id);
      await confirmTransaction(id, status);
      toast.success(`Transaction marked as ${status}`);
      await fetchPending();
    } catch (e: any) {
      toast.error(e.message || "Failed to update transaction status");
    } finally {
      setLoadingId(null);
    }
  };

  if (pendingTxns.length === 0) return null;


  const filteredTxns = pendingTxns.filter(txn => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const receiver = (txn.upiPayeeName || txn.personId?.name || txn.note || "UPI Recipient").toLowerCase();
    const upiVpa = (txn.upiPayeeVpa || "").toLowerCase();
    const dateStr = formatDateString(txn.date, "DD-MM-YYYY");
    return (
      receiver.includes(s) ||
      upiVpa.includes(s) ||
      txn.amount.toString().includes(s) ||
      dateStr.includes(s)
    );
  });

  const totalAmount = pendingTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);
  const paginatedTxns = filteredTxns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger render={
        <Card className="cursor-pointer border border-amber-500/20 bg-amber-500/5 shadow-sm hover:bg-amber-500/10 transition-all duration-200 h-full">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-4 h-full">
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className={cn(TYPOGRAPHY.cardTitle, "font-bold text-amber-800 dark:text-amber-400 truncate")}>Pending UPI</h3>
                  <p className={cn(TYPOGRAPHY.cardSubtitle, "text-amber-600 dark:text-amber-500 font-medium mt-0.5")}>
                    {pendingTxns.length} payment{pendingTxns.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={cn(TYPOGRAPHY.cardLabel, "text-muted-foreground uppercase font-semibold tracking-wider block")}>Total Pending:</span>
                <div className={cn(TYPOGRAPHY.cardAmount, "font-bold text-amber-700 dark:text-amber-400")}>
                  {format(totalAmount)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      } />
      <DialogContent initialFocus={false} size="lg">
        <DialogHeader>
          <DialogTitle className={cn(TYPOGRAPHY.modalTitle, "flex items-center gap-2")}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <span>Pending UPI Payments</span>
          </DialogTitle>
          <DialogDescription className={TYPOGRAPHY.modalDescription}>
            Confirm whether these UPI payments were successful or cancelled to keep your balances aligned.
          </DialogDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by receiver name, amount, or date..."
              className={cn(TYPOGRAPHY.modalInput, "pl-9 bg-background w-full h-9 text-xs sm:text-sm rounded-xl border-border/60")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {paginatedTxns.map((txn) => {
            const payeeName = txn.upiPayeeName || txn.personId?.name || txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const upiId = txn.upiPayeeVpa || "";
            const personName = txn.personId?.name || "";
            const noteText = txn.note || "No note attached";
            const isLoading = loadingId === txn._id;

            return (
              <div key={txn._id} className="flex flex-col p-3 sm:p-4 bg-background rounded-xl border border-amber-500/20 gap-3 shadow-inner">
                <div>
                  <p className={cn(TYPOGRAPHY.cardTitle, "font-bold text-foreground")}>{payeeName}</p>
                  {upiId && <p className={cn(TYPOGRAPHY.cardSubtitle, "font-mono mt-0.5")}>{upiId}</p>}
                  {personName && personName !== payeeName && <p className={cn(TYPOGRAPHY.cardSubtitle, "text-primary/80 mt-0.5")}>👤 {personName}</p>}
                  <p className={cn(TYPOGRAPHY.cardLabel, "text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap font-normal")}>
                    <span className={cn(TYPOGRAPHY.badge, "font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-md")}>{format(txn.amount)}</span>
                    <span>•</span>
                    <span>{formatDateString(txn.date, "DD-MM-YYYY hh:mm A")}</span>
                    {txn.accountId?.name && <><span>•</span><span>{txn.accountId.name}</span></>}
                  </p>
                  <p className={cn(TYPOGRAPHY.cardSubtitle, "mt-1 italic opacity-80")}>
                    &ldquo;{noteText}&rdquo;
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-2 sm:px-3"
                    onClick={() => handleResolve(txn._id, "completed")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Paid
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-semibold text-xs h-8 px-2 sm:px-3"
                    onClick={() => handleResolve(txn._id, "cancelled")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="font-semibold text-xs h-8 px-2 sm:px-3 border border-amber-500/20 text-amber-700 bg-amber-50"
                    onClick={() => handleResolve(txn._id, "pending")}
                    disabled={isLoading}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Later
                  </Button>
                </div>
              </div>
            );
          })}
        </DialogBody>

        {totalPages > 1 && (
          <DialogFooter className="justify-between sm:justify-between w-full">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
