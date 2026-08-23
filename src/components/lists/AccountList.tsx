"use client";

import { List, Popconfirm, Modal } from "antd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "antd";
import { AccountForm } from "../forms/AccountForm";
import { deleteAccount } from "@/actions/account";
import { Trash, Search, Filter, Landmark, Wallet, Banknote, CreditCard } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const getAccountIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bank': return <Landmark className="w-5 h-5" />;
    case 'cash': return <Banknote className="w-5 h-5" />;
    case 'card': return <CreditCard className="w-5 h-5" />;
    case 'wallet': return <Wallet className="w-5 h-5" />;
    case 'investment': return <Landmark className="w-5 h-5" />;
    case 'saving': return <Landmark className="w-5 h-5" />;
    default: return <Wallet className="w-5 h-5" />;
  }
};

const getAccountColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bank': return '#3b82f6'; // blue
    case 'cash': return '#10b981'; // emerald
    case 'card': return '#f59e0b'; // amber
    case 'wallet': return '#8b5cf6'; // violet
    case 'investment': return '#0ea5e9'; // sky
    case 'saving': return '#14b8a6'; // teal
    default: return '#6b7280'; // gray
  }
};
import { useState, useMemo } from "react";
import { useCurrency } from "@/hooks/useCurrency";

export function AccountList({ accounts }: { accounts: any[] }) {
  const { format } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All" || acc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, typeFilter]);
  if (accounts.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl border-dashed col-span-full">
        <p className="text-muted-foreground mb-4">No accounts found.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 sm:w-[200px]">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
          <Select
            className="w-full h-10"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: "All Types", value: "All" },
              { label: "Bank Account", value: "bank" },
              { label: "Cash", value: "cash" },
              { label: "Saving Account", value: "saving" },
              { label: "Credit Card", value: "card" },
              { label: "Wallet", value: "wallet" },
              { label: "Investment", value: "investment" },
              { label: "Other", value: "other" },
            ]}
          />
        </div>
      </div>

      {filteredAccounts.length === 0 && (
        <div className="p-8 text-center border rounded-xl border-dashed">
          <p className="text-muted-foreground">No accounts match your filters.</p>
        </div>
      )}

      {filteredAccounts.length > 0 && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={filteredAccounts}
          pagination={{ pageSize: 12, position: "bottom", align: "end" }}
          renderItem={(account: any) => (
            <List.Item>
              <div className="relative group block rounded-2xl p-5 border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden gap-4">
                <div className="flex justify-between items-start gap-4 z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner"
                      style={{ backgroundColor: account.color || getAccountColor(account.type) }}
                    >
                      {account.icon ? <CategoryIcon name={account.icon} className="w-5 h-5 text-white" /> : getAccountIcon(account.type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg leading-tight line-clamp-1 capitalize" title={account.name}>{account.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-1 tracking-wider">
                        {account.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 transition-opacity shrink-0">
                    <AccountForm account={account} />
                    <Popconfirm
                      title="Delete Account"
                      description="Are you sure you want to delete this account?"
                      onConfirm={async () => {
                        try {
                          const res = await deleteAccount(account._id);
                          if (res && !res.success) {
                            Modal.error({
                              title: "Cannot Delete Account",
                              content: res.error || "This account is in use elsewhere.",
                              okText: "Close",
                            });
                          }
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </Popconfirm>
                  </div>
                </div>

                <div className="z-10 mt-auto pt-4">
                  <div className="text-3xl font-bold truncate tracking-tight">{format(account.balance)}</div>
                </div>

                {/* Decorative background circle */}
                <div
                  className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                  style={{ backgroundColor: account.color || getAccountColor(account.type) }}
                />
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
