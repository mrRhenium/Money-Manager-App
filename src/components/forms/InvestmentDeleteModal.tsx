"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Select, Input } from "antd";
import { deleteInvestment } from "@/actions/investment";
import { useCurrency } from "@/hooks/useCurrency";

const { TextArea } = Input;

export function InvestmentDeleteModal({ investment }: { investment: any }) {
  const { format } = useCurrency();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { toast } = useToast();
  
  const isUtilized = investment.investedAmount > 0;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteInvestment(investment._id, reason, notes);
      if (res && !res.success) {
        toast.error(res.error || "Failed to delete investment");
      } else {
        toast.success(isUtilized ? "The investment has been marked as closed." : "The investment was permanently removed.");
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      } />
      <DialogContent initialFocus={false} size={isUtilized ? "md" : "sm"}>
        {!isUtilized ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Trash className="w-4 h-4" />
                </div>
                <span>Delete {investment.name}</span>
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this asset? It has no invested amount yet.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="h-9 px-4 text-[length:var(--font-size-modal-btn)]" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" 
                onClick={handleDelete} 
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Investment"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span>Stop Tracking {investment.name}</span>
              </DialogTitle>
              <DialogDescription>
                You have {format(investment.investedAmount)} invested in this asset. Tracking will be paused.
              </DialogDescription>
            </DialogHeader>
            
            <DialogBody className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Notice: Preserving History</p>
                <p>You have an invested amount of {format(investment.investedAmount)} in this asset. <strong>Its historical data will NOT be deleted</strong>, but tracking will be paused and its status marked as closed/sold.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Stopping <span className="text-red-500">*</span></label>
                <Select
                  className="w-full h-10"
                  placeholder="Select a reason..."
                  value={reason || undefined}
                  onChange={setReason}
                  options={[
                    { label: "Sold the asset completely", value: "Sold" },
                    { label: "No longer want to track it", value: "Stop tracking" },
                    { label: "Matured and withdrawn", value: "Matured" },
                    { label: "Other", value: "Other" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
                <TextArea 
                  rows={3} 
                  placeholder="Please explain why you are stopping this investment..."
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input 
                  type="checkbox"
                  id="confirm-inv-deletion" 
                  checked={confirmed}
                  onChange={(e: any) => setConfirmed(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <label
                  htmlFor="confirm-inv-deletion"
                  className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-snug"
                >
                  I understand this will change the status to closed, preserving past data but hiding it from active tracking.
                </label>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" className="h-9 px-4 text-[length:var(--font-size-modal-btn)]" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" 
                onClick={handleDelete} 
                disabled={loading || !reason || !notes.trim() || !confirmed}
              >
                {loading ? "Processing..." : "Stop Tracking"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
