"use client";

import { Table, List } from "antd";
import { ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";

export function CreditCardTransactionTable({ transactions, userTimezone }: { transactions: any[], userTimezone: string }) {
  const { format } = useCurrency();

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
        <span className="font-medium whitespace-nowrap text-red-500">
          -{format(record.amount)}
        </span>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    }
  ];

  return (
    <>
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="_id"
          pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: "No transactions yet." }}
        />
      </div>
      <div className="md:hidden w-full">
        <List
          dataSource={transactions}
          pagination={{ pageSize: 10, align: "center", size: "small" }}
          locale={{ emptyText: "No transactions yet." }}
          renderItem={(record: any) => (
            <List.Item className="border-none px-0 py-2">
              <div className="bg-card w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                
                <div className="flex justify-between items-start pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 shrink-0">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-base leading-tight">
                        {record.categoryId?.name || "Expense"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {formatDate(record.date, "standard", userTimezone)}
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-lg whitespace-nowrap text-red-500">
                    -{format(record.amount)}
                  </div>
                </div>

                <div className="pl-1 text-sm flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg w-fit">
                    <CategoryIcon name={record.categoryId?.icon || "credit-card"} color={record.categoryId?.color || "#ef4444"} className="w-4 h-4 shrink-0" />
                    <span className="font-medium text-foreground/80 truncate text-xs">{record.note || "Card Transaction"}</span>
                  </div>

                  {record.upiPayeeName && (
                    <div className="flex flex-col gap-1 py-0.5">
                      <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg text-xs w-fit text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-bold">UPI:</span>
                        <span className="font-medium text-foreground opacity-90 truncate">{record.upiPayeeName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </>
  );
}
