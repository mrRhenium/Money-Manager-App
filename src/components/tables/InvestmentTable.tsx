"use client";

import { Table, Popconfirm } from "antd";
import { Button } from "@/components/ui/button";
import { deleteInvestment } from "@/actions/investment";
import { Trash, Eye } from "lucide-react";
import Link from "next/link";
import { InvestmentForm } from "../forms/InvestmentForm";
import { formatDate } from "@/lib/helpers";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function InvestmentTable({ investments, accounts }: { investments: any[], accounts: any[] }) {
  const columns = [
    {
      title: "#",
      key: "srNo",
      width: 50,
      render: (_: any, __: any, index: number) => <span className="text-muted-foreground font-medium">{index + 1}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${record.color || '#8b5cf6'}15` }}>
            <CategoryIcon name={record.icon} color={record.color} className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">{record.investmentType}</div>
          </div>
        </div>
      )
    },
    {
      title: "Invested",
      dataIndex: "investedAmount",
      key: "investedAmount",
      render: (amount: number, record: any) => `₹${amount.toLocaleString("en-IN")}`,
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (amount: number) => <span className="font-medium">₹{amount.toLocaleString("en-IN")}</span>,
    },
    {
      title: "Returns",
      key: "returns",
      render: (_: any, record: any) => {
        const ret = (record.currentValue || 0) - (record.investedAmount || 0);
        const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
        const isPos = ret >= 0;
        return (
          <div className={isPos ? "text-emerald-500" : "text-destructive"}>
            <div className="font-medium">{isPos ? "+" : ""}₹{ret.toLocaleString("en-IN")}</div>
            <div className="text-xs">({isPos ? "+" : ""}{retPct.toFixed(2)}%)</div>
          </div>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/investments/${record._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <InvestmentForm investment={record} accounts={accounts} />
          <Popconfirm
            title="Delete Investment"
            description="Are you sure? This deletes history too."
            onConfirm={() => deleteInvestment(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash className="w-4 h-4" />
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div className="overflow-x-auto">
      <Table
        columns={columns}
        dataSource={investments.map(inv => ({ ...inv, key: inv._id }))}
        pagination={{ pageSize: 10 }}
        className="custom-table"
      />
    </div>
  );
}
