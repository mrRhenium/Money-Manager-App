"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Select, Input } from "antd";
import { deleteInvestment } from "@/actions/investment";

const { TextArea } = Input;

export function InvestmentDeleteModal({ investment }: { investment: any }) {
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
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!isUtilized ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete {investment.name}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">Are you sure you want to delete <strong>{investment.name}</strong>? It has no invested amount yet.</p>
            <DialogFooter className="sm:justify-center gap-2 pt-4">
              <Button variant="outline" className="rounded-full px-6" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                className="rounded-full px-6 bg-red-100 text-red-600 hover:bg-red-200 border-0" 
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
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Stop Tracking {investment.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                <p className="font-semibold mb-1">Notice: Preserving History</p>
                <p>You have an invested amount of ₹{investment.investedAmount} in this asset. <strong>Its historical data will NOT be deleted</strong>, but tracking will be paused and its status marked as closed/sold.</p>
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
                  className="mt-1"
                />
                <label
                  htmlFor="confirm-inv-deletion"
                  className="text-sm text-muted-foreground cursor-pointer leading-tight"
                >
                  I understand this will change the status to closed, preserving past data but hiding it from active tracking.
                </label>
              </div>
            </div>

            <DialogFooter className="mt-4 sm:justify-center gap-2">
              <Button variant="outline" className="rounded-full px-6" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                className="rounded-full px-6 bg-red-100 text-red-600 hover:bg-red-200 border-0" 
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
