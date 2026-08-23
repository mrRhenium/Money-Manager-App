"use client";

import { Popconfirm } from "antd";
import { Button } from "@/components/ui/button";
import { deleteCurrency } from "@/actions/currency";
import { Trash } from "lucide-react";
import { message } from "antd";

export function CurrencyDeleteButton({ id, isBase }: { id: string, isBase: boolean }) {
  const handleDelete = async () => {
    if (isBase) {
      message.error("Cannot delete the base currency.");
      return;
    }
    const res = await deleteCurrency(id);
    if (res.success) {
      message.success("Currency deleted");
    } else {
      message.error(res.error || "Failed to delete currency");
    }
  };

  return (
    <Popconfirm
      title="Delete Currency"
      description="Are you sure you want to delete this currency?"
      onConfirm={handleDelete}
      okText="Yes"
      cancelText="No"
      disabled={isBase}
    >
      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors" disabled={isBase}>
        <Trash className="w-4 h-4" />
      </Button>
    </Popconfirm>
  );
}
