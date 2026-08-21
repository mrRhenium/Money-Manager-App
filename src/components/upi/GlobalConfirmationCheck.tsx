"use client";

import React, { useState, useEffect } from "react";
import { getAwaitingTransactions, confirmTransaction } from "@/actions/transaction";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Smartphone, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function GlobalConfirmationCheck() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [awaitingTxns, setAwaitingTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAwaitingConfirmations = async () => {
    if (!session?.user?.id) return;
    try {
      const txns = await getAwaitingTransactions();
      setAwaitingTxns(txns);
    } catch (e) {
      console.error("Failed to check awaiting confirmations", e);
    }
  };

  // Run on mount, user shift, and focus/app resume
  useEffect(() => {
    fetchAwaitingConfirmations();
  }, [session]);

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
  }, [session]);

  // Intercept back button when awaiting confirms exist
  useEffect(() => {
    if (awaitingTxns.length > 0) {
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
        toast.warning("Please confirm the pending payment first");
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [awaitingTxns]);

  const handleConfirm = async (id: string, status: "completed" | "cancelled" | "pending") => {
    try {
      setLoading(true);
      await confirmTransaction(id, status);
      
      if (status === "completed") {
        toast.success("Payment marked as successful!");
      } else if (status === "cancelled") {
        toast.warning("Payment marked as cancelled.");
      } else {
        toast.info("Transaction kept pending for later confirmation.");
      }

      // Re-fetch list
      await fetchAwaitingConfirmations();
    } catch (e: any) {
      toast.error(e.message || "Failed to confirm payment status");
    } finally {
      setLoading(false);
    }
  };

  if (awaitingTxns.length === 0) return null;

  // Render modal for the first awaiting transaction
  const activeTxn = awaitingTxns[0];

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md p-6 rounded-2xl z-[9999]" 
        showCloseButton={false}
      >
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center animate-bounce mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <DialogTitle className="font-bold text-lg text-foreground">Confirm UPI Payment</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Did you complete the payment of <span className="font-bold text-primary">₹{activeTxn.amount}</span> to <span className="font-bold">{activeTxn.note?.replace("UPI Payment to ", "") || "UPI Recipient"}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            onClick={() => handleConfirm(activeTxn._id, "completed")}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Yes, Paid Successfully
          </Button>
          <Button 
            variant="destructive"
            className="w-full font-bold"
            onClick={() => handleConfirm(activeTxn._id, "cancelled")}
            disabled={loading}
          >
            No, Failed / Cancelled
          </Button>
          <Button 
            variant="secondary"
            className="w-full font-bold"
            onClick={() => handleConfirm(activeTxn._id, "pending")}
            disabled={loading}
          >
            Not sure yet / Ask me later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
