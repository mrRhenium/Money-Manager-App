"use client";

import { Table } from "antd";

export function InvestmentTable({ investments }: { investments: any[] }) {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium whitespace-nowrap">{name}</span>,
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <span className="capitalize whitespace-nowrap">{type}</span>,
      filters: [
        { text: "Stocks", value: "stocks" },
        { text: "Mutual Fund", value: "mutual fund" },
        { text: "Real Estate", value: "real estate" },
        { text: "Gold", value: "gold" },
        { text: "Crypto", value: "crypto" },
        { text: "Other", value: "other" },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: "Invested",
      dataIndex: "investedAmount",
      key: "investedAmount",
      align: "right" as const,
      render: (amount: number) => <span className="whitespace-nowrap">₹{amount.toLocaleString("en-IN")}</span>,
      sorter: (a: any, b: any) => a.investedAmount - b.investedAmount,
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      align: "right" as const,
      render: (amount: number) => <span className="whitespace-nowrap">₹{amount.toLocaleString("en-IN")}</span>,
      sorter: (a: any, b: any) => a.currentValue - b.currentValue,
    },
    {
      title: "Returns",
      key: "returns",
      align: "right" as const,
      render: (_: any, record: any) => {
        const ret = record.currentValue - record.investedAmount;
        const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
        return (
          <span className={`font-medium whitespace-nowrap ${ret >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {ret >= 0 ? "+" : ""}₹{ret.toLocaleString("en-IN")} ({ret >= 0 ? "+" : ""}{retPct.toFixed(2)}%)
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.currentValue - a.investedAmount) - (b.currentValue - b.investedAmount),
      defaultSortOrder: 'descend' as const,
    }
  ];

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden w-full">
      <Table 
        columns={columns} 
        dataSource={investments} 
        rowKey="_id"
        pagination={{ pageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
        scroll={{ x: 'max-content' }}
        className="w-full"
      />
    </div>
  );
}
