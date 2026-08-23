"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Select, Input } from "antd";
import { deleteInsurancePolicy } from "@/actions/insurance";

const { TextArea } = Input;

export function InsuranceDeleteModal({ policy }: { policy: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  
  const { toast } = useToast();
  
  // Note: we can't cleanly determine if there are paid premiums without fetching it,
  // but if the policy status is active and renewal date has passed, it likely has.
  // The backend handles the check and soft/hard deletes appropriately.
  // We will assume it might be utilized if it's older than a certain date, or we just always ask.
  const isLikelyUtilized = true; 

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteInsurancePolicy(policy._id, reason, notes);
      if (res && !res.success) {
        toast.error(res.error || "Failed to delete policy");
      } else {
        toast.success("Policy has been successfully processed.");
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete / Surrender {policy.policyName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            <p className="font-semibold mb-1">Notice: Preserving History</p>
            <p>If you have paid premiums for this policy, <strong>its historical data will NOT be deleted</strong>. Instead, tracking will be paused and its status marked as Lapsed or Surrendered. If no premiums exist, it will be fully deleted.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason <span className="text-red-500">*</span></label>
            <Select
              className="w-full h-10"
              placeholder="Select a reason..."
              value={reason || undefined}
              onChange={setReason}
              options={[
                { label: "Surrendered / Cancelled", value: "surrender" },
                { label: "Lapsed (Stopped paying)", value: "lapsed" },
                { label: "Created by mistake (Hard Delete)", value: "mistake" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <TextArea 
              rows={3} 
              placeholder="Any details (optional)..."
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <input 
              type="checkbox"
              id="confirm-ins-deletion" 
              checked={confirmed}
              onChange={(e: any) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirm-ins-deletion"
              className="text-sm text-muted-foreground cursor-pointer leading-tight"
            >
              I understand this action and wish to proceed.
            </label>
          </div>
        </div>

        <DialogFooter className="mt-4 sm:justify-center gap-2">
          <Button variant="outline" className="rounded-full px-6" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            className="rounded-full px-6 bg-red-100 text-red-600 hover:bg-red-200 border-0" 
            onClick={handleDelete} 
            disabled={loading || !reason || !confirmed}
          >
            {loading ? "Processing..." : "Confirm Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
