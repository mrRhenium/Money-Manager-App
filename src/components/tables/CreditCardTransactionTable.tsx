"use client";

import { Table } from "antd";
import { ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function CreditCardTransactionTable({ transactions, userTimezone }: { transactions: any[], userTimezone: string }) {
  const columns = [
    {
      title: "Description",
      key: "description",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-foreground whitespace-nowrap">{record.note || record.categoryId?.name || "Expense"}</p>
            {record.upiPayeeName && (
              <div className="inline-flex items-center gap-1 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded text-[10px] text-primary mt-1">
                <span className="font-bold">UPI:</span>
                <span>{record.upiPayeeName} ({record.upiPayeeVpa})</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap flex items-center gap-1.5">
              <span>{formatDate(record.date, "standard", userTimezone)}</span>
              <span>•</span>
              {record.categoryId && (
                <CategoryIcon name={record.categoryId.icon} color={record.categoryId.color} className="w-3 h-3 shrink-0" />
              )}
              <span>{record.categoryId?.name || "Expense"}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      align: "right" as const,
      render: (_: any, record: any) => (
        <span className="font-semibold text-foreground whitespace-nowrap">
          -₹{record.amount.toLocaleString("en-IN")}
        </span>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={transactions}
      rowKey="_id"
      pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: "No transactions yet." }}
    />
  );
}
