"use client";

import { Table, Popconfirm } from "antd";
import { Button } from "@/components/ui/button";
import { deleteInsurancePolicy } from "@/actions/insurance";
import { Trash, Eye } from "lucide-react";
import Link from "next/link";
import { InsuranceForm } from "../forms/InsuranceForm";
import { formatDate } from "@/lib/helpers";

export function InsuranceTable({ policies, accounts }: { policies: any[], accounts: any[] }) {
  const columns = [
    {
      title: "Policy",
      dataIndex: "policyName",
      key: "policyName",
      render: (name: string, record: any) => (
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{record.provider} ({record.type})</div>
        </div>
      )
    },
    {
      title: "Coverage",
      dataIndex: "coverageAmount",
      key: "coverageAmount",
      render: (amount: number) => `₹${amount.toLocaleString("en-IN")}`,
    },
    {
      title: "Premium",
      dataIndex: "premiumAmount",
      key: "premiumAmount",
      render: (amount: number, record: any) => (
        <div>
          <div className="font-medium">₹{amount.toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground">{record.premiumFrequency}</div>
        </div>
      )
    },
    {
      title: "Next Renewal",
      dataIndex: "renewalDate",
      key: "renewalDate",
      render: (date: string) => date ? new Date(date).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/insurance/${record._id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <InsuranceForm policy={record} accounts={accounts} />
          <Popconfirm
            title="Delete Policy"
            description="Are you sure? This deletes history too."
            onConfirm={() => deleteInsurancePolicy(record._id)}
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
        dataSource={policies.map(p => ({ ...p, key: p._id }))}
        pagination={{ pageSize: 10 }}
        className="custom-table"
      />
    </div>
  );
}
