"use client";

import { useTransition } from "react";
import { deleteSystemCategory } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function CategoryDeleteButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Are you sure you want to delete this master category?")) {
      startTransition(async () => {
        try {
          await deleteSystemCategory(categoryId);
        } catch (error) {
          console.error("Failed to delete category", error);
          alert("Failed to delete category.");
        }
      });
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </Button>
  );
}
