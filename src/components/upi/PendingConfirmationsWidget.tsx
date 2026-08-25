"use client";

import React, { useState, useEffect } from "react";
import { getPendingTransactions, confirmTransaction } from "@/actions/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function PendingConfirmationsWidget() {
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
          <CardContent className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 h-full">
            <div className="flex items-center sm:items-start gap-2 sm:gap-4 w-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs sm:text-base text-amber-800 dark:text-amber-400 truncate">Pending UPI</h3>
                <p className="text-[10px] sm:text-sm text-amber-600 dark:text-amber-500 font-medium truncate sm:whitespace-normal">
                  {pendingTxns.length} payment{pendingTxns.length !== 1 ? "s" : ""} awaiting
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
              <span className="text-[9px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-wider block hidden sm:block">Total Pending: </span>
              <div className="font-bold text-sm sm:text-base text-amber-700 dark:text-amber-400">
                {format(totalAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
      } />
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Smartphone className="w-5 h-5 animate-pulse" />
            Resolve Pending UPI Payments
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Confirm whether these UPI payments were successful or cancelled to keep your balances aligned.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by receiver name, amount, or date..."
              className="pl-9 bg-background w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {paginatedTxns.map((txn) => {
            const payeeName = txn.upiPayeeName || txn.personId?.name || txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const upiId = txn.upiPayeeVpa || "";
            const personName = txn.personId?.name || "";
            const noteText = txn.note || "No note attached";
            const isLoading = loadingId === txn._id;
            
            return (
              <div key={txn._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border border-amber-500/20 gap-3 shadow-inner">
                <div>
                  <p className="font-bold text-sm text-foreground">{payeeName}</p>
                  {upiId && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{upiId}</p>}
                  {personName && personName !== payeeName && <p className="text-[11px] text-primary/80 mt-0.5">👤 {personName}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground bg-primary/10 px-1.5 py-0.5 rounded">{format(txn.amount)}</span>
                    <span>•</span>
                    <span>{formatDateString(txn.date, "DD-MM-YYYY hh:mm A")}</span>
                    {txn.accountId?.name && <><span>•</span><span>{txn.accountId.name}</span></>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic opacity-80">
                    "{noteText}"
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3"
                    onClick={() => handleResolve(txn._id, "completed")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    Paid
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="font-semibold text-xs h-8 px-3"
                    onClick={() => handleResolve(txn._id, "cancelled")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="font-semibold text-xs h-8 px-3 border border-amber-500/20 text-amber-700 bg-amber-50"
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
        </div>
      
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
