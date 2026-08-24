"use client";

import { useTransition } from "react";
import { deleteSystemCategory } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Modal } from "antd";

export function CategoryDeleteButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
    Modal.confirm({
      title: 'Delete Master Category',
      content: 'Are you sure you want to delete this master category?',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        startTransition(async () => {
          try {
            await deleteSystemCategory(categoryId);
            toast.success("Category deleted successfully.");
          } catch (error) {
            console.error("Failed to delete category", error);
            toast.error("Failed to delete category.");
          }
        });
      }
    });
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
