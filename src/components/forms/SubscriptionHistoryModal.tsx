"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pagination } from "antd";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const { format } = useCurrency();

  
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const dateStr = formatDateString(tx.date, "DD-MM-YYYY");
    const amountStr = tx.amount.toString();
    return dateStr.includes(q) || amountStr.includes(q) || (tx.note || "").toLowerCase().includes(q);
  });

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Transaction History">
          <History className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent initialFocus={false} size="md">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <span>Payment History</span>
          </DialogTitle>
          <DialogDescription>
            Historical payments logged for this subscription.
          </DialogDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by date (DD-MM-YYYY) or amount..." 
              className="pl-9 bg-background h-9 text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading history...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchTerm ? "No matching payments found." : "No payments recorded yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTransactions.map((tx) => (
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
        </DialogBody>

        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <DialogFooter className="justify-center sm:justify-center">
            <Pagination 
              current={currentPage} 
              pageSize={ITEMS_PER_PAGE} 
              total={filteredTransactions.length} 
              onChange={setCurrentPage} 
              size="small" 
            />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
