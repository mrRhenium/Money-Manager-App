"use client";

import React, { useState, useEffect } from "react";
import { getPendingTransactions, confirmTransaction } from "@/actions/transaction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Smartphone, Check, X, Clock, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function PendingConfirmationsWidget() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [pendingTxns, setPendingTxns] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  return (
    <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Smartphone className="w-5 h-5 animate-pulse" />
          Pending UPI Confirmations
        </CardTitle>
        <CardDescription className="text-xs text-amber-600 dark:text-amber-500">
          You have {pendingTxns.length} payment attempt(s) that require confirmation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
