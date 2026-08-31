"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Input } from "antd";
import { Trash, AlertTriangle } from "lucide-react";
import { deleteRecurringBill } from "@/actions/recurringBill";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

const { TextArea } = Input;

export function RecurringBillDeleteModal({ bill }: { bill: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { toast } = useToast();
  const { format } = useCurrency();

  const isUtilized = bill.transactionsCount > 0;

  const handleDelete = async () => {
    if (isUtilized) {
      if (!reason) {
        toast.error("Please select a reason for deletion");
        return;
      }
      if (!notes.trim()) {
        toast.error("Please provide additional notes");
        return;
      }
      if (!confirmed) {
        toast.error("Please confirm the deletion");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await deleteRecurringBill(bill._id, reason, notes);
      if (res && !res.success) {
        toast.error(res.error || "Failed to delete subscription");
      } else {
        toast.success("Subscription deleted successfully.");
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subscription");
    } finally {
      setLoading(false);
    }
  };

  // Unused subscription - Simple delete
  if (!isUtilized) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <Trash className="w-4 h-4" />
          </Button>
        } />
        <DialogContent initialFocus={false} size="sm">
          <DialogHeader>
            <DialogTitle>
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Trash className="w-4 h-4" />
              </div>
              <span>Delete {bill.name}</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? It hasn't been tracked or paid yet.
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
              {loading ? "Deleting..." : "Delete Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Utilized subscription - Mandatory Reason
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      } />
      <DialogContent initialFocus={false} size="md">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>Delete {bill.name}</span>
          </DialogTitle>
          <DialogDescription>
            You have paid this subscription {bill.transactionsCount} times. Past payments will be preserved.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Warning: Stop Tracking Subscription</p>
            <p>You have paid this subscription <strong>{bill.transactionsCount}</strong> times. <strong>Your payment history will not be deleted</strong>. This subscription will be moved to your paused list and future tracking will stop.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deletion <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Cancelled the subscription", value: "Cancelled" },
                { label: "No longer want to track it", value: "Stop tracking" },
                { label: "Data entry error / duplicate", value: "Data error" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
            <TextArea 
              rows={3} 
              placeholder="Please explain why you are deleting this subscription..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-sub-deletion" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <label
              htmlFor="confirm-sub-deletion"
              className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer"
            >
              I confirm that I want to pause this subscription and keep my past payments.
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
            {loading ? "Deleting..." : "Delete Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
