"use client";

import React, { useState, useEffect } from "react";
import { getPendingTransactions, confirmTransaction } from "@/actions/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Smartphone, Check, X, Clock, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function PendingConfirmationsWidget() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [pendingTxns, setPendingTxns] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const totalAmount = pendingTxns.reduce((sum, txn) => sum + txn.amount, 0);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger render={
        <Card className="cursor-pointer border border-amber-500/20 bg-amber-500/5 shadow-sm hover:bg-amber-500/10 transition-all duration-200">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center animate-pulse">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-amber-800 dark:text-amber-400">Pending UPI Confirmations</h3>
                <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                  {pendingTxns.length} payment attempt{pendingTxns.length > 1 ? "s" : ""} awaiting your confirmation
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block sm:inline">Total Pending: </span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400 ml-1">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      } />
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Smartphone className="w-5 h-5 animate-pulse" />
            Resolve Pending UPI Payments
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Confirm whether these UPI payments were successful or cancelled to keep your balances aligned.
          </p>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {pendingTxns.map((txn) => {
            const payeeName = txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const isLoading = loadingId === txn._id;
            
            return (
              <div key={txn._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border border-amber-500/20 gap-3 shadow-inner">
                <div>
                  <p className="font-bold text-sm text-foreground">{payeeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Amount: <span className="font-semibold text-foreground">₹{txn.amount.toLocaleString("en-IN")}</span> • {new Date(txn.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
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
      </DialogContent>
    </Dialog>
  );
}
