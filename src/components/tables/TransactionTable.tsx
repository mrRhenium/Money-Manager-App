"use client";

import { Table, Popconfirm } from "antd";
import { formatDate } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "../forms/TransactionForm";
import { deleteTransaction } from "@/actions/transaction";
import { Trash } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function TransactionTable({
  transactions,
  userTimezone,
  accounts,
  categories,
  people = [],
}: {
  transactions: any[];
  userTimezone: string;
  accounts: any[];
  categories: any[];
  people?: any[];
}) {
  const columns = [
    {
      title: "#",
      key: "srNo",
      width: 50,
      render: (_: any, __: any, index: number) => <span className="text-muted-foreground font-medium">{index + 1}</span>,
    },
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
        if (record.type === "transfer") {
          return (
            <div className="flex items-center gap-2 whitespace-nowrap font-medium text-foreground">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
              </div>
              <span>Internal Transfer</span>
            </div>
          );
        }
        if (!record.categoryId) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap font-medium text-foreground">
            <CategoryIcon name={record.categoryId.icon} color={record.categoryId.color} className="w-4 h-4 shrink-0" />
            <span>{record.categoryId.name}</span>
          </div>
        );
      }
    },
    {
      title: "Account",
      key: "account",
      render: (_: any, record: any) => {
        if (record.type === "transfer" && record.toAccountId) {
          return (
            <span className="whitespace-nowrap flex items-center gap-1.5 text-sm">
              <span className="font-medium text-muted-foreground">{record.accountId?.name || "-"}</span>
              <span className="text-muted-foreground/50">→</span>
              <span className="font-medium">{record.toAccountId?.name || "-"}</span>
            </span>
          );
        }
        return <span className="whitespace-nowrap">{record.accountId?.name || "-"}</span>;
      },
    },
    {
      title: "Note/Payee",
      key: "note",
      render: (_: any, record: any) => {
        const isQr = record.paymentSource === "upi_scan" || (record.upiPayeeName && record.upiPayeeVpa);
        if (isQr) {
          return (
            <div className="flex flex-col gap-1 py-1">
              {record.note && <span className="font-semibold text-sm text-foreground">{record.note}</span>}
              <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg text-xs w-fit text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">UPI:</span>
                <span className="font-medium text-foreground opacity-90">{record.upiPayeeName}</span>
                <span className="text-muted-foreground font-mono">({record.upiPayeeVpa})</span>
              </div>
            </div>
          );
        }
        return <span className="text-muted-foreground text-sm">{record.note || "-"}</span>;
      }
    },
    {
      title: "Amount",
      key: "amount",
      align: "right" as const,
      render: (_: any, record: any) => {
        const isTransfer = record.type === "transfer";
        const isNegative = record.type === "expense" || record.type === "lend";
        const isPositive = record.type === "income";
        
        if (isTransfer) {
          return (
            <span className="font-semibold whitespace-nowrap text-blue-500">
              ₹{record.amount.toLocaleString("en-IN")}
            </span>
          );
        }

        return (
          <span className={`font-medium whitespace-nowrap ${isPositive ? "text-emerald-500" : (isNegative ? "text-red-500" : "")}`}>
            {isNegative ? "-" : "+"}{" "}₹{record.amount.toLocaleString("en-IN")}
          </span>
        );
      },
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-center gap-1.5">
          <TransactionForm accounts={accounts} categories={categories} people={people} transaction={record} />
          <Popconfirm
            title="Delete Transaction"
            description="Are you sure you want to delete this transaction?"
            onConfirm={() => deleteTransaction(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
              <Trash className="w-4 h-4" />
            </Button>
          </Popconfirm>
        </div>
      ),
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
