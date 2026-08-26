"use client";

import React from "react";
import { Table, List } from "antd";
import { Search, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyForm } from "@/components/admin/CurrencyForm";
import { CurrencyDeleteButton } from "@/components/admin/CurrencyDeleteButton";

export function AdminCurrenciesClient({ currencies }: { currencies: any[] }) {

  const getColumnSearchProps = (dataIndex: string, title: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div className="p-3 w-64 bg-card border border-border shadow-md rounded-xl flex flex-col gap-3" onKeyDown={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Search ${title}...`}
          value={selectedKeys[0] || ""}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          className="h-9"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => clearFilters && clearFilters()} className="h-8 px-3 text-xs">
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={() => confirm()} className="h-8 px-3 text-xs">
            Search
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search className={`w-4 h-4 ${filtered ? 'text-primary' : 'text-muted-foreground'}`} />
    ),
    onFilter: (value: any, record: any) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase())
        : false,
  });

  const columns = [
    {
      title: "Sr. No.",
      key: "sno",
      width: 70,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Currency",
      key: "code",
      dataIndex: "code",
      sorter: (a: any, b: any) => a.code.localeCompare(b.code),
      defaultSortOrder: 'ascend' as const,
      ...getColumnSearchProps("code", "Code"),
      render: (code: string, record: any) => (
        <div>
          <div className="font-medium">{code}</div>
          <div className="text-sm text-muted-foreground">{record.name}</div>
        </div>
      ),
    },
    {
      title: "Symbol",
      key: "symbol",
      dataIndex: "symbol",
      render: (symbol: string) => <div className="text-lg font-bold">{symbol}</div>,
    },
    {
      title: "Base",
      key: "isBase",
      dataIndex: "isBase",
      filters: [
        { text: 'Yes', value: true },
        { text: 'No', value: false },
      ],
      onFilter: (value: any, record: any) => record.isBase === value,
      render: (isBase: boolean) => (
        isBase ? (
          <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-none">Base Currency</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
    {
      title: "Exchange Rate",
      key: "exchangeRate",
      dataIndex: "exchangeRate",
      sorter: (a: any, b: any) => a.exchangeRate - b.exchangeRate,
      render: (rate: number) => <div className="font-medium font-mono">{rate}</div>,
    },
    {
      title: "Status",
      key: "isActive",
      dataIndex: "isActive",
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: any) => record.isActive === value,
      render: (isActive: boolean) => (
        <Badge variant={isActive ? "outline" : "secondary"} className={isActive ? "border-green-500 text-green-600 shadow-none" : "shadow-none"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-end gap-1">
          <CurrencyForm currency={record} />
          <CurrencyDeleteButton id={record._id} isBase={record.isBase} />
        </div>
      ),
    }
  ];

  return (
    <>
      <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow overflow-hidden w-full">
        <Table
          columns={columns}
          dataSource={currencies}
          rowKey="_id"
          pagination={{ defaultPageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          className="w-full"
        />
      </div>

      <div className="md:hidden w-full">
        <List
          dataSource={currencies}
          pagination={{ pageSize: 10, align: "center", size: "small" }}
          renderItem={(record: any) => (
            <List.Item className="border-none px-0 py-2">
              <div className="bg-card w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${record.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                <div className="flex justify-between items-start pl-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/30 shrink-0 flex items-center justify-center font-bold text-xl w-10 h-10">
                      {record.symbol}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground leading-none mb-1 truncate flex items-center gap-2">
                        {record.code}
                        {record.isBase && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">Base</span>}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {record.name}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-medium bg-muted/50 px-2 py-1 rounded">
                    {record.exchangeRate}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-1 pl-1">
                  <Badge variant={record.isActive ? "outline" : "secondary"} className={record.isActive ? "border-green-500 text-green-600 shadow-none text-[10px]" : "shadow-none text-[10px]"}>
                    {record.isActive ? "Active" : "Inactive"}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <CurrencyForm currency={record} />
                    <CurrencyDeleteButton id={record._id} isBase={record.isBase} />
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </>
  );
}
