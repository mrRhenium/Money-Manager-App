"use client";

import { useTransition } from "react";
import { deleteUser } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function UserDeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm("Are you sure you want to delete this user? This will delete all their data permanently.")) {
      startTransition(async () => {
        try {
          await deleteUser(userId);
        } catch (error) {
          console.error("Failed to delete user", error);
          alert("Failed to delete user.");
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
