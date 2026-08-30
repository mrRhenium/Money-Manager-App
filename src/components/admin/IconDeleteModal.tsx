"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash, AlertTriangle, ShieldCheck, Ban } from "lucide-react";
import { deleteIcon } from "@/actions/icon";
import { message } from "antd";
import { DynamicLucideIcon } from "@/components/ui/IconColorPicker";

interface IconDeleteModalProps {
  icon: any;
  onSuccess?: () => void;
}

export function IconDeleteModal({ icon, onSuccess }: IconDeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isConsumed = Boolean(icon.isConsumed || icon.usageCount > 0);

  const handleDelete = async () => {
    if (isConsumed) {
      message.error("Cannot delete an icon that is actively used in the database.");
      return;
    }

    setLoading(true);
    try {
      const res = await deleteIcon(icon._id);
      if (res.success) {
        message.success(`Icon '${icon.label}' deleted successfully`);
        setOpen(false);
        onSuccess?.();
      } else {
        message.error(res.error || "Failed to delete icon");
      }
    } catch (err: any) {
      message.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title={isConsumed ? "Cannot delete (In Use)" : "Delete Icon"}
          >
            <Trash className="w-4 h-4" />
          </Button>
        }
      />

      <DialogContent className="w-[95vw] sm:max-w-md overflow-x-hidden p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConsumed
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {isConsumed ? <AlertTriangle className="w-5 h-5" /> : <Trash className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {isConsumed ? "Cannot Delete Icon" : "Delete System Icon"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isConsumed ? "Dependency Protection Active" : "This action cannot be undone"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {/* Target Icon Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <DynamicLucideIcon name={icon.name} className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-foreground truncate">{icon.label}</div>
              <div className="text-xs text-muted-foreground font-mono">{icon.name} • {icon.category}</div>
            </div>
          </div>

          {isConsumed ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-amber-800 dark:text-amber-200">
                  <Ban className="w-4 h-4" /> Deletion Blocked
                </div>
                This icon is currently linked to <strong>{icon.usageCount}</strong> record(s) across your financial data. To prevent data corruption, icons in use cannot be deleted.
              </div>

              {icon.usages && icon.usages.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground">Active Usages:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {icon.usages.map((u: any) => (
                      <div
                        key={u.entity}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border text-xs"
                      >
                        <span className="font-medium text-foreground">{u.entity}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                          {u.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted/30 border text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <strong>{icon.label}</strong> ({icon.name})? It is not currently used anywhere.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 text-xs"
          >
            {isConsumed ? "Close" : "Cancel"}
          </Button>

          {!isConsumed && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="h-9 text-xs font-semibold"
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
