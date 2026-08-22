"use client";

import { Table, Popconfirm, List } from "antd";
import { formatDate } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "../forms/TransactionForm";
import { deleteTransaction } from "@/actions/transaction";
import { Trash } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useCurrency } from "@/hooks/useCurrency";

export function TransactionTable({
  transactions,
  userTimezone,
  accounts,
  categories,
  people = [],
  creditCards = [],
}: {
  transactions: any[];
  userTimezone: string;
  accounts: any[];
  categories: any[];
  people?: any[];
  creditCards?: any[];
  userCurrency?: string;
}) {
  const { format } = useCurrency();
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
        if (!record.categoryId) {
          if (record.note?.toLowerCase().includes("emi payment")) {
            return (
              <div className="flex items-center gap-2 whitespace-nowrap font-medium text-foreground">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                </div>
                <span>EMI Payment</span>
              </div>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        }
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
              {format(record.amount)}
            </span>
          );
        }

        return (
          <span className={`font-medium whitespace-nowrap ${isPositive ? "text-emerald-500" : (isNegative ? "text-red-500" : "")}`}>
            {isNegative ? "-" : "+"}{" "}{format(record.amount)}
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
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
          <TransactionForm accounts={accounts} categories={categories} people={people} creditCards={creditCards} transaction={record} />
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
    <>
      <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow overflow-hidden w-full">
        <Table 
          columns={columns} 
          dataSource={transactions} 
          rowKey="_id"
          pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          className="w-full"
        />
      </div>
      <div className="md:hidden w-full">
        <List
          dataSource={transactions}
          pagination={{ pageSize: 10, align: "center", size: "small" }}
          renderItem={(record: any) => {
            const isTransfer = record.type === "transfer";
            const isNegative = record.type === "expense" || record.type === "lend";
            const isPositive = record.type === "income";
            const isQr = record.paymentSource === "upi_scan" || (record.upiPayeeName && record.upiPayeeVpa);

            return (
              <List.Item className="border-none px-0 py-2">
                <div className="bg-card w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-red-500' : 'bg-blue-500'}`} />
                  
                  <div className="flex justify-between items-start pl-1">
                    <div className="flex items-center gap-3">
                      {isTransfer ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: record.categoryId ? `${record.categoryId.color}20` : (record.note?.toLowerCase().includes("emi payment") ? '#fee2e2' : '#f3f4f6') }}>
                          {record.categoryId ? (
                            <CategoryIcon name={record.categoryId.icon} color={record.categoryId.color} className="w-5 h-5" />
                          ) : record.note?.toLowerCase().includes("emi payment") ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
                          ) : (
                            <span className="text-muted-foreground w-5 h-5" />
                          )}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-base leading-tight">
                          {isTransfer ? "Internal Transfer" : (record.categoryId?.name || (record.note?.toLowerCase().includes("emi payment") ? "EMI Payment" : "Uncategorized"))}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                          {formatDate(record.date, "standard", userTimezone)}
                        </span>
                      </div>
                    </div>

                    <div className={`font-bold text-lg whitespace-nowrap ${isPositive ? "text-emerald-500" : (isNegative ? "text-red-500" : "text-blue-500")}`}>
                      {isNegative ? "-" : (isPositive ? "+" : "")}{format(record.amount)}
                    </div>
                  </div>

                  <div className="pl-1 text-sm flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg w-fit">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-landmark shrink-0"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                      {isTransfer && record.toAccountId ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-foreground/80 truncate max-w-[100px] sm:max-w-none">{record.accountId?.name || "-"}</span>
                          <span className="text-muted-foreground/60">→</span>
                          <span className="font-medium text-foreground/80 truncate max-w-[100px] sm:max-w-none">{record.toAccountId?.name || "-"}</span>
                        </span>
                      ) : (
                        <span className="font-medium text-foreground/80 truncate text-xs">{record.accountId?.name || "-"}</span>
                      )}
                    </div>

                    {isQr ? (
                      <div className="flex flex-col gap-1 py-0.5">
                        {record.note && <span className="font-semibold text-sm text-foreground">{record.note}</span>}
                        <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg text-xs w-fit text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="font-bold">UPI:</span>
                          <span className="font-medium text-foreground opacity-90 truncate">{record.upiPayeeName}</span>
                        </div>
                      </div>
                    ) : (
                      record.note && <div className="text-foreground/90 text-sm truncate">{record.note}</div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t mt-1">
                    <div onClick={e => e.stopPropagation()}>
                      <TransactionForm accounts={accounts} categories={categories} people={people} creditCards={creditCards} transaction={record} />
                    </div>
                    <Popconfirm
                      title="Delete Transaction"
                      description="Are you sure you want to delete this transaction?"
                      onConfirm={() => deleteTransaction(record._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
    </>
  );
}
