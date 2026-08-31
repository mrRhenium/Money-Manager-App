"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteCurrency } from "@/actions/currency";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";

export function CurrencyDeleteButton({
  id,
  isBase,
  code,
  name,
}: {
  id: string;
  isBase: boolean;
  code?: string;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (isBase) {
      toast.error("Cannot delete the base currency.");
      return;
    }
    setLoading(true);
    try {
      const res = await deleteCurrency(id);
      if (res.success) {
        toast.success("Currency deleted successfully");
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to delete currency");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete currency");
    } finally {
      setLoading(false);
    }
  };

  if (isBase) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground opacity-40 cursor-not-allowed rounded-full"
        disabled
        title="Cannot delete base currency"
      >
        <Trash className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        onClick={() => setOpen(true)}
      >
        <Trash className="w-4 h-4" />
      </Button>

      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Currency"
        entityName={code ? `${code}${name ? ` - ${name}` : ""}` : "Currency"}
        description={`Are you sure you want to delete the currency "${code || ""}"? Accounts or transactions using this currency may be affected.`}
        confirmText="Delete Currency"
        onConfirm={handleDelete}
        isLoading={loading}
      />
    </>
  );
}
