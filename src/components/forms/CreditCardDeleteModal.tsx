"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Input } from "antd";
import { Trash, AlertTriangle } from "lucide-react";
import { deleteCreditCard } from "@/actions/creditCard";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

const { TextArea } = Input;

export function CreditCardDeleteModal({ card, transactionsCount = 0 }: { card: any, transactionsCount?: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { toast } = useToast();
  const { format } = useCurrency();

  const hasBalance = card.currentOutstanding > 0;
  const isUtilized = transactionsCount > 0;

  const handleDelete = async () => {
    if (hasBalance) return;

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
      const res = await deleteCreditCard(card._id, reason, notes);
      if (res && !res.success) {
        toast.error(res.error || "Failed to delete credit card");
      } else {
        toast.success("Credit card deleted successfully.");
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete credit card");
    } finally {
      setLoading(false);
    }
  };

  // Cards with active balances cannot be deleted
  if (hasBalance) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed rounded-full"
        title={`Please clear the outstanding balance of ${format(card.currentOutstanding)} before deleting this card.`}
        onClick={(e) => e.preventDefault()}
      >
        <Trash className="w-4 h-4" />
      </Button>
    );
  }

  // Never used cards - Simple delete
  if (!isUtilized) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <Trash className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Credit Card</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this credit card? It hasn't been used yet.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Cards with zero balance but have past transactions - Mandatory Reason
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Credit Card History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            <p className="font-semibold mb-1">Warning: Removing Card History</p>
            <p>You are about to delete a credit card that has been used in {transactionsCount} transaction(s). <strong>Your transactions will not be deleted</strong>, but the card itself will no longer appear in your active list.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deletion <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Card was closed/cancelled", value: "Closed" },
                { label: "Card was lost/stolen and replaced", value: "Lost" },
                { label: "No longer want to track this card", value: "No longer tracking" },
                { label: "Data entry error / duplicate", value: "Data error" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
            <TextArea 
              rows={3} 
              placeholder="Please explain why you are deleting this card..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-card-deletion" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirm-card-deletion"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that I want to delete this credit card and keep its transaction history.
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !reason || !notes.trim() || !confirmed}>
            {loading ? "Deleting..." : "Delete Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
