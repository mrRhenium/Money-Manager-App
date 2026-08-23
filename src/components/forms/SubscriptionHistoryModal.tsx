"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Loader2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDateString } from "@/lib/dateTimeHelper";

import { getTransactionsForSubscription } from "@/actions/transaction";

interface SubscriptionHistoryModalProps {
  bill: any;
}

export function SubscriptionHistoryModal({ bill }: SubscriptionHistoryModalProps) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { format } = useCurrency();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getTransactionsForSubscription(bill._id)
        .then(data => {
          setTransactions(data || []);
        })
        .catch(err => console.error("Failed to load history", err))
        .finally(() => setLoading(false));
    }
  }, [open, bill._id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="View History">
          <History className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Payment History
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading history...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <div key={tx._id} className="flex justify-between items-center p-3 rounded-lg border bg-muted/20">
                  <div>
                    <p className="font-semibold">{formatDateString(tx.date, "DD MMM, YYYY")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tx.note || "Auto-payment"}</p>
                  </div>
                  <div className="font-bold text-destructive">
                    -{format(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
