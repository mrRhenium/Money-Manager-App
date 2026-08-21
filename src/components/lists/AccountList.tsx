"use client";

import { List, Popconfirm, Modal } from "antd";
import { Button } from "@/components/ui/button";
import { AccountForm } from "../forms/AccountForm";
import { deleteAccount } from "@/actions/account";
import { Trash } from "lucide-react";

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
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium capitalize">{account.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase bg-secondary px-2 py-1 rounded-md">{account.type}</span>
                </div>
                <div className="pt-2">
                  <div className="text-2xl font-bold">₹{account.balance.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                <AccountForm account={account} />
                <Popconfirm
                  title="Delete Account"
                  description="Are you sure you want to delete this account?"
                  onConfirm={async () => {
                    try {
                      await deleteAccount(account._id);
                    } catch (err: any) {
                      Modal.error({
                        title: "Cannot Delete Account",
                        content: err.message || "This account is in use elsewhere.",
                        okText: "Close",
                      });
                    }
                  }}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                    <Trash className="w-4 h-4" />
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
