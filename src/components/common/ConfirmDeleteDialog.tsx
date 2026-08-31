"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title?: string;
  entityName?: string;
  entityType?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDeleteDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  title = "Confirm Deletion",
  entityName,
  entityType,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  isLoading: externalLoading = false,
  children,
}: ConfirmDeleteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const loading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      // Error should be handled by caller's toast/alert
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent initialFocus={false} size="sm">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="truncate">{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description || (
              <>
                Are you sure you want to delete{" "}
                {entityName ? (
                  <strong className="font-semibold text-foreground">"{entityName}"</strong>
                ) : (
                  `this ${entityType || "item"}`
                )}
                ? This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {children && <div className="px-4 py-2">{children}</div>}

        <DialogFooter className="w-full">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 text-[length:var(--font-size-modal-btn)]"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs flex items-center justify-center gap-1.5"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{loading ? "Deleting..." : confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
