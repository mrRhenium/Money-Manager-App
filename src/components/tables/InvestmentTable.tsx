"use client";

import { Table, Popconfirm } from "antd";
import { Button } from "@/components/ui/button";
import { deleteInvestment } from "@/actions/investment";
import { Trash, Eye } from "lucide-react";
import Link from "next/link";
import { InvestmentForm } from "../forms/InvestmentForm";
import { formatDate } from "@/lib/helpers";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";

export function InvestmentTable({ investments, accounts }: { investments: any[], accounts: any[] }) {
  const { format } = useCurrency();

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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${record.color || '#8b5cf6'}15` }}>
            <CategoryIcon name={record.icon} color={record.color} className="w-5 h-5" />
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
      render: (amount: number, record: any) => format(amount),
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (amount: number, record: any) => (
        <div>
          <span className="font-medium">{format(amount)}</span>
          {record.autoPriceUpdateEnabled && record.lastAutoUpdatedAt && (
            <div className="text-[10px] text-muted-foreground" title={new Date(record.lastAutoUpdatedAt).toLocaleString()}>
              Auto-synced
            </div>
          )}
          {record.autoPriceUpdateEnabled && !record.lastAutoUpdatedAt && (
             <div className="text-[10px] text-amber-500">
               Pending sync
             </div>
          )}
        </div>
      )
    },
    {
      title: "Returns",
      key: "returns",
      render: (_: any, record: any) => {
        const ret = (record.currentValue || 0) - (record.investedAmount || 0);
        const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
        const isPos = ret > 0;
        const isNeg = ret < 0;
        return (
          <div className={`flex flex-col gap-0.5 ${isPos ? "text-emerald-500" : isNeg ? "text-red-500" : "text-muted-foreground"}`}>
            <div className="font-medium">{isPos ? "+" : ""}{format(ret)}</div>
            <div className="text-xs">{isPos ? "+" : ""}{retPct.toFixed(2)}%</div>
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
    <>
      <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
        {investments.map(record => {
          const ret = (record.currentValue || 0) - (record.investedAmount || 0);
          const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
          const isPos = ret > 0;
          const isNeg = ret < 0;

          return (
            <div key={record._id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner" 
                    style={{ backgroundColor: record.color || '#8b5cf6' }}
                  >
                    <CategoryIcon name={record.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-tight truncate">{record.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{record.investmentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                  <Link href={`/investments/${record._id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <InvestmentForm investment={record} accounts={accounts} triggerClassName="h-8 w-8 rounded-full" />
                  <Popconfirm
                    title="Delete Investment"
                    description="Are you sure? This deletes history too."
                    onConfirm={() => deleteInvestment(record._id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Invested</p>
                  <p className="font-semibold text-sm">{format(record.investedAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Current Value</p>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{format(record.currentValue)}</span>
                    {record.autoPriceUpdateEnabled && record.lastAutoUpdatedAt && (
                      <span className="text-[10px] text-muted-foreground">Auto-synced</span>
                    )}
                    {record.autoPriceUpdateEnabled && !record.lastAutoUpdatedAt && (
                      <span className="text-[10px] text-amber-500">Pending sync</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 pt-2 mt-2 border-t border-border/30">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Returns</p>
                    <div className={`flex items-center gap-2 font-semibold ${isPos ? "text-emerald-500" : isNeg ? "text-red-500" : "text-muted-foreground"}`}>
                      <span>{isPos ? "+" : ""}{format(ret)}</span>
                      <span className="text-xs bg-current/10 px-1.5 py-0.5 rounded-sm">{isPos ? "+" : ""}{retPct.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative background circle */}
              <div 
                className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                style={{ backgroundColor: record.color || '#8b5cf6' }}
              />
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <Table
          columns={columns}
          dataSource={investments.map(inv => ({ ...inv, key: inv._id }))}
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </div>
    </>
  );
}
