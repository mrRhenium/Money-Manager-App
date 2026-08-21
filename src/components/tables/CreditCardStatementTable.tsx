"use client";

import { Table, Tag } from "antd";
import { formatDate } from "@/lib/helpers";

export function CreditCardStatementTable({ statements, userTimezone }: { statements: any[], userTimezone: string }) {
  const columns = [
    {
      title: "Statement",
      key: "statementMonth",
      render: (_: any, record: any) => (
        <span className="font-medium text-foreground whitespace-nowrap">Statement: {record.statementMonth}</span>
      ),
    },
    {
      title: "Due Date",
      key: "dueDate",
      render: (_: any, record: any) => (
        <span className="text-muted-foreground whitespace-nowrap">{formatDate(record.dueDate, "standard", userTimezone)}</span>
      ),
    },
    {
      title: "Amount",
      key: "totalAmount",
      align: "right" as const,
      render: (_: any, record: any) => (
        <span className="font-bold text-foreground whitespace-nowrap">₹{record.totalAmount.toLocaleString("en-IN")}</span>
      ),
      sorter: (a: any, b: any) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Status",
      key: "paymentStatus",
      align: "center" as const,
      render: (_: any, record: any) => {
        if (record.paymentStatus === "paid") {
          return <Tag color="success">Paid</Tag>;
        } else if (record.paymentStatus === "partially_paid") {
          return <Tag color="warning">Partial (₹{record.amountPaid})</Tag>;
        } else if (record.paymentStatus === "overdue") {
          return <Tag color="error">Overdue</Tag>;
        }
        return <Tag color="processing">Unpaid</Tag>;
      },
      filters: [
        { text: "Paid", value: "paid" },
        { text: "Unpaid", value: "unpaid" },
        { text: "Partial", value: "partially_paid" },
        { text: "Overdue", value: "overdue" },
      ],
      onFilter: (value: any, record: any) => record.paymentStatus === value,
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={statements}
      rowKey="_id"
      pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: "No statements generated yet." }}
    />
  );
}
