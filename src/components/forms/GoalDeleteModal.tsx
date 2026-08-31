"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Input } from "antd";
import { Trash, AlertTriangle } from "lucide-react";
import { deleteGoal } from "@/actions/goal";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";

const { TextArea } = Input;

export function GoalDeleteModal({ goal, accounts }: { goal: any, accounts: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [returnAccountId, setReturnAccountId] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { format } = useCurrency();
  const { toast } = useToast();

  const isCompleted = goal.status === "completed" || goal.currentAmount >= goal.targetAmount;
  const hasFunds = goal.currentAmount > 0;

  const handleDelete = async () => {
    if (isCompleted) return;

    if (hasFunds) {
      if (!reason) {
        toast.error("Please select a reason for deletion");
        return;
      }
      if (!returnAccountId) {
        toast.error("Please select a return account for the saved funds");
        return;
      }
      if (!notes.trim()) {
        toast.error("Please provide additional notes");
        return;
      }
      if (!confirmed) {
        toast.error("Please confirm the reversal");
        return;
      }
    }

    setLoading(true);
    try {
      await deleteGoal(goal._id, reason, notes, returnAccountId);
      toast.success(
        hasFunds 
          ? `Goal deleted and ${format(goal.currentAmount)} returned to account.` 
          : "Goal deleted successfully."
      );
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete goal");
    } finally {
      setLoading(false);
    }
  };

  // Completed goals cannot be deleted
  if (isCompleted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed rounded-full"
        title="Completed goals are kept for your financial history and cannot be deleted."
        onClick={(e) => e.preventDefault()}
      >
        <Trash className="w-4 h-4" />
      </Button>
    );
  }

  // Active goals with NO funds - Simple delete
  if (!hasFunds) {
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
              <span>Delete {goal.name}</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this goal? It hasn't been started yet.
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
              {loading ? "Deleting..." : "Delete Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Active goals WITH funds - Mandatory Reason + Return Account
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
            <span>Delete {goal.name}</span>
          </DialogTitle>
          <DialogDescription>
            You have saved {format(goal.currentAmount)} in this goal. Saved money will be refunded to your selected account.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs sm:text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold mb-1">Warning: Funds Return Required</p>
            <p>You have saved <strong>{format(goal.currentAmount)}</strong> in this goal. Deleting it will automatically reverse all related transactions and return the money to your chosen account.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Return Funds To <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select account..."
              value={returnAccountId || undefined}
              onChange={setReturnAccountId}
              options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deletion <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Goal is no longer relevant", value: "Not relevant" },
                { label: "Switching to a different savings plan", value: "Switching plans" },
                { label: "Emergency — need the funds back", value: "Emergency" },
                { label: "Data entry error / duplicate", value: "Data error" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
            <TextArea 
              rows={3} 
              placeholder="Please explain why you are deleting this goal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-goal-reversal" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <label
              htmlFor="confirm-goal-reversal"
              className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer"
            >
              I understand that {format(goal.currentAmount)} will be credited back to my selected account and fund transactions will be deleted.
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
            disabled={loading || !reason || !returnAccountId || !notes.trim() || !confirmed}
          >
            {loading ? "Processing..." : "Reverse & Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
