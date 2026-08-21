"use client";

import { List } from "antd";
import { Button } from "@/components/ui/button";

export function AccountList({ accounts }: { accounts: any[] }) {
  if (accounts.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl border-dashed col-span-full">
        <p className="text-muted-foreground mb-4">No accounts found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
        dataSource={accounts}
        pagination={{ pageSize: 12, position: "bottom", align: "end" }}
        renderItem={(account: any) => (
          <List.Item>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-full">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium capitalize">{account.name}</h3>
                <span className="text-xs text-muted-foreground uppercase bg-secondary px-2 py-1 rounded-md">{account.type}</span>
              </div>
              <div className="pt-2">
                <div className="text-2xl font-bold">₹{account.balance.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
