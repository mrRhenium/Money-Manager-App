"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
      <DialogTrigger>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <Trash className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {account.name}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Are you sure you want to delete this account? You can only delete accounts that have no transactions linked to them.</p>
        <DialogFooter className="sm:justify-center gap-2 pt-4">
          <Button variant="outline" className="rounded-full px-6" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            className="rounded-full px-6 bg-red-100 text-red-600 hover:bg-red-200 border-0" 
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
