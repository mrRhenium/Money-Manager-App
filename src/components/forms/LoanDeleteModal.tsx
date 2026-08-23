"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, Input } from "antd";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteLoan } from "@/actions/loan";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";

const { TextArea } = Input;

export function LoanDeleteModal({ loan }: { loan: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { format } = useCurrency();
  const { toast } = useToast();

  const isCompleted = loan.status === "completed";
  const amountPaid = loan.totalAmount - loan.outstandingBalance;
  const hasPayments = amountPaid > 0;

  const handleDelete = async () => {
    if (isCompleted) return;

    if (hasPayments) {
      if (!reason) {
        toast.error("Please select a reason for deletion");
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
      await deleteLoan(loan._id, reason, notes);
      toast.success(
        hasPayments 
          ? `Loan deleted and ${format(amountPaid)} reversed to account.` 
          : "Loan deleted successfully."
      );
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete loan");
    } finally {
      setLoading(false);
    }
  };

  // Completed loans cannot be deleted
  if (isCompleted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground opacity-50 cursor-not-allowed rounded-full"
        title="Completed loans are kept for your financial records and cannot be deleted."
        onClick={(e) => e.preventDefault()}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    );
  }

  // Active loans with NO payments - Simple delete
  if (!hasPayments) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Loan</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this loan? It hasn't been used yet.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Active loans WITH payments - Mandatory Reason + Reversal
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Loan & Reverse Payments
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
            <p className="font-semibold mb-1">Warning: Financial Reversal Required</p>
            <p>You have paid <strong>{format(amountPaid)}</strong> towards this loan. Deleting it will automatically reverse all EMI transactions and credit the money back to the linked account.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deletion <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Loan was settled/closed early", value: "Settled early" },
                { label: "Loan was refinanced with another lender", value: "Refinanced" },
                { label: "Data entry error / duplicate", value: "Data error" },
                { label: "Loan was forgiven / written off", value: "Forgiven" },
                { label: "Other", value: "Other" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes <span className="text-red-500">*</span></label>
            <TextArea 
              rows={3} 
              placeholder="Please explain why you are deleting this loan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-reversal" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirm-reversal"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand that all EMI transactions will be reversed and {format(amountPaid)} will be credited back to my account.
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !reason || !notes.trim() || !confirmed}>
            {loading ? "Reversing..." : "Delete & Reverse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
