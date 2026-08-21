"use client";

import { useTransition } from "react";
import { deleteUser } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function UserDeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
    if (confirm("Are you sure you want to delete this user? This will delete all their data permanently.")) {
      startTransition(async () => {
        try {
          await deleteUser(userId);
          toast.success("User deleted successfully.");
        } catch (error) {
          console.error("Failed to delete user", error);
          toast.error("Failed to delete user.");
        }
      });
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-2"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete
    </Button>
  );
}
