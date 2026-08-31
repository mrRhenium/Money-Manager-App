"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/actions/account";
import { Modal } from "antd";

export function AccountDeleteModal({ account }: { account: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteAccount(account._id);
      if (res && !res.success) {
        Modal.error({
          title: "Cannot Delete Account",
          content: res.error || "This account is in use elsewhere.",
          okText: "Close",
        });
        setOpen(false);
      } else {
        setOpen(false);
      }
    } catch (err: any) {
      Modal.error({
        title: "Cannot Delete Account",
        content: err.message || "This account is in use elsewhere.",
        okText: "Close",
      });
      setOpen(false);
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
      <DialogContent initialFocus={false} size="sm">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Trash className="w-4 h-4" />
            </div>
            <span>Delete {account.name}</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this account? You can only delete accounts that have no transactions linked to them.
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
            {loading ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
