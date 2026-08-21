"use client";

import { Table } from "antd";
import { formatDate } from "@/lib/helpers";

export function TransactionTable({ transactions, userTimezone }: { transactions: any[], userTimezone: string }) {
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => <span className="whitespace-nowrap">{formatDate(date, "standard", userTimezone)}</span>,
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <span className="capitalize">{type}</span>,
      filters: [
        { text: "Income", value: "income" },
        { text: "Expense", value: "expense" },
        { text: "Transfer", value: "transfer" },
        { text: "Lend", value: "lend" },
        { text: "Borrow", value: "borrow" },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: "Category",
      key: "category",
      render: (_: any, record: any) => {
        if (!record.categoryId) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: record.categoryId.color }} />
            <span>{record.categoryId.name}</span>
          </div>
        );
      }
    },
    {
      title: "Account",
      key: "account",
      render: (_: any, record: any) => <span className="whitespace-nowrap">{record.accountId?.name || "-"}</span>,
    },
    {
      title: "Amount",
      key: "amount",
      align: "right" as const,
      render: (_: any, record: any) => {
        const isNegative = record.type === "expense" || record.type === "lend";
        const isPositive = record.type === "income";
        return (
          <span className={`font-medium whitespace-nowrap ${isPositive ? "text-emerald-500" : (isNegative ? "text-red-500" : "")}`}>
            {isNegative ? "-" : "+"}{" "}₹{record.amount.toLocaleString("en-IN")}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.amount - b.amount,
    }
  ];

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden w-full">
      <Table 
        columns={columns} 
        dataSource={transactions} 
        rowKey="_id"
        pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
        scroll={{ x: 'max-content' }}
        className="w-full"
      />
    </div>
  );
}
