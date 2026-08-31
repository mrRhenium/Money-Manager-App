"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Input } from "antd";
import { Trash, AlertTriangle } from "lucide-react";
import { deleteBudget } from "@/actions/budget";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

const { TextArea } = Input;

export function BudgetDeleteModal({ budget, totalSpent = 0 }: { budget: any, totalSpent?: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { toast } = useToast();
  const { format } = useCurrency();

  const isUtilized = totalSpent > 0;

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
      const res = await deleteBudget(budget._id, reason, notes);
      if (res && !res.success) {
        toast.error(res.error || "Failed to delete budget");
      } else {
        toast.success("Budget deleted successfully.");
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete budget");
    } finally {
      setLoading(false);
    }
  };

  // Completely unused budget - Simple delete
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
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <Trash className="w-4 h-4" />
              </div>
              <span>Delete {budget.categoryId?.name} Budget</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget limit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the budget limit for <strong>{budget.categoryId?.name}</strong>?
            </p>
          </DialogBody>
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
              {loading ? "Deleting..." : "Delete Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Utilized budget - requires reason & notes
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
            <span>Delete {budget.categoryId?.name} Budget</span>
          </DialogTitle>
          <DialogDescription>
            You have spent {format(totalSpent)} against this budget. Transactions will remain intact.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Warning: Removing Budget Limit</p>
            <p>You have spent <strong>{format(totalSpent)}</strong> against this budget. <strong>Your transactions will not be deleted</strong>, but the budget limit will be removed for this period.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deletion <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Budget limit is no longer needed", value: "No longer needed" },
                { label: "Created by mistake / wrong category", value: "Mistake" },
                { label: "Replacing with a different budget limit", value: "Replacing" },
                { label: "Data entry error / duplicate", value: "Data error" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
            <TextArea 
              rows={3} 
              placeholder="Please explain why you are deleting this budget..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-budget-deletion" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <label
              htmlFor="confirm-budget-deletion"
              className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer"
            >
              I confirm that I want to remove this budget limit and keep my existing transactions.
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
            {loading ? "Deleting..." : "Delete Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
