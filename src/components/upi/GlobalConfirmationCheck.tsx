"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAwaitingTransactions, confirmTransaction } from "@/actions/transaction";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Smartphone, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCurrency } from "@/hooks/useCurrency";

export function GlobalConfirmationCheck() {
  const { data: session } = useSession();
  const { format } = useCurrency();
  const { toast } = useToast();
  
  const [awaitingTxns, setAwaitingTxns] = useState<any[]>([]);
  const [confirmingStatus, setConfirmingStatus] = useState<"completed" | "cancelled" | "pending" | "dismiss" | null>(null);
  const [dismissedTxnIds, setDismissedTxnedIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAwaitingConfirmations = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const txns = await getAwaitingTransactions();
      // Filter out transactions that user dismissed in the current session
      const visibleTxns = txns.filter((t: any) => !dismissedTxnIds.includes(t._id));
      setAwaitingTxns(visibleTxns);
      if (visibleTxns.length > 0) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } catch (e) {
      console.error("Failed to check awaiting confirmations", e);
    }
  }, [session?.user?.id, dismissedTxnIds]);

  // Run on mount, session update
  useEffect(() => {
    fetchAwaitingConfirmations();
  }, [fetchAwaitingConfirmations]);

  // Run on window focus / visibility change without spamming
  useEffect(() => {
    const handleFocus = () => {
      fetchAwaitingConfirmations();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchAwaitingConfirmations]);

  const handleConfirm = async (id: string, status: "completed" | "cancelled" | "pending") => {
    try {
      setConfirmingStatus(status);
      await confirmTransaction(id, status);
      
      if (status === "completed") {
        toast.success("Payment marked as successful!");
      } else if (status === "cancelled") {
        toast.warning("Payment marked as cancelled.");
      } else {
        toast.info("Transaction kept pending for later confirmation.");
      }

      // Add to dismissed for this session and close
      setDismissedTxnedIds(prev => [...prev, id]);
      setAwaitingTxns(prev => prev.filter(t => t._id !== id));
      setIsOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to confirm payment status");
    } finally {
      setConfirmingStatus(null);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      setConfirmingStatus("dismiss");
      // Keep it as pending in background so user can still see it in transaction list
      await confirmTransaction(id, "pending");
    } catch (err) {
      console.error("Error setting transaction to pending on dismiss", err);
    } finally {
      setDismissedTxnedIds(prev => [...prev, id]);
      setAwaitingTxns(prev => prev.filter(t => t._id !== id));
      setIsOpen(false);
      setConfirmingStatus(null);
    }
  };

  if (awaitingTxns.length === 0 || !isOpen) return null;

  // Render modal for the first awaiting transaction
  const activeTxn = awaitingTxns[0];
  const isLoading = confirmingStatus !== null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleDismiss(activeTxn._id);
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md p-6 rounded-2xl z-[9999]" 
        showCloseButton={true}
      >
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center animate-bounce mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <DialogTitle className="font-bold text-lg text-foreground">Confirm UPI Payment</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1 text-center">
            Did you complete the payment of <span className="font-bold text-primary">{format(activeTxn.amount)}</span> to <span className="font-bold">{activeTxn.note?.replace("UPI Payment to ", "") || "UPI Payment"}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            onClick={() => handleConfirm(activeTxn._id, "completed")}
            disabled={isLoading}
          >
            {confirmingStatus === "completed" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Yes, Paid Successfully
          </Button>
          <Button 
            variant="destructive"
            className="w-full font-bold"
            onClick={() => handleConfirm(activeTxn._id, "cancelled")}
            disabled={isLoading}
          >
            {confirmingStatus === "cancelled" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            No, Failed / Cancelled
          </Button>
          <Button 
            variant="secondary"
            className="w-full font-bold"
            onClick={() => handleConfirm(activeTxn._id, "pending")}
            disabled={isLoading}
          >
            {confirmingStatus === "pending" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Not sure yet / Ask me later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
