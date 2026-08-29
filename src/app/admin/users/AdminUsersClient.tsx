"use client";

import React, { useState } from "react";
import { Table, List, Switch } from "antd";
import { formatDate } from "@/lib/helpers";
import { Search, User as UserIcon, Calendar, Mail, MapPin, DollarSign, Fingerprint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toggleUserStatus } from "@/actions/admin";
import { message } from "antd";

export function AdminUsersClient({ users, userTimezone }: { users: any[], userTimezone: string }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId);
      message.success(currentStatus ? "User deactivated" : "User activated");
    } catch (error: any) {
      message.error(error.message || "Failed to toggle status");
    }
  };

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
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name", "Name"),
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps("email", "Email"),
      render: (text: string) => <span className="text-muted-foreground">{text}</span>,
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) => <span className="whitespace-nowrap">{formatDate(date, "standard", userTimezone)}</span>,
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => (
        <Switch
          checked={record.isActive !== false}
          onChange={() => handleToggle(record._id, record.isActive !== false)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedUser(record)}>
          Details
        </Button>
      ),
    }
  ];

  return (
    <>
      <div className="hidden lg:block rounded-xl border bg-card text-card-foreground shadow overflow-hidden w-full">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          pagination={{ defaultPageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
          className="w-full"
        />
      </div>

      <div className="lg:hidden w-full">
        <List
          dataSource={users}
          pagination={{ pageSize: 10, align: "center", size: "small" }}
          renderItem={(record: any) => {
            const isActive = record.isActive !== false;

            return (
              <List.Item className="border-none px-0 py-2">
                <div className="bg-card w-full border shadow-sm rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden" onClick={() => setSelectedUser(record)}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                  <div className="flex justify-between items-start pl-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted/30 shrink-0 flex items-center justify-center text-primary">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground leading-none mb-1 truncate">
                          {record.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                          {record.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-1 text-sm flex flex-col gap-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        Joined: {formatDate(record.createdAt, "standard", userTimezone)}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isActive}
                          onChange={() => handleToggle(record._id, isActive)}
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserIcon className="text-primary w-6 h-6" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shadow-inner shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold truncate">{selectedUser.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{selectedUser.email}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border p-4 rounded-xl shadow-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Joined Date
                  </p>
                  <p className="font-semibold">{formatDate(selectedUser.createdAt, "standard", userTimezone)}</p>
                </div>
                <div className="bg-card border p-4 rounded-xl shadow-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Timezone
                  </p>
                  <p className="font-semibold truncate" title={selectedUser.timezone || "UTC"}>{selectedUser.timezone || "UTC"}</p>
                </div>
                <div className="bg-card border p-4 rounded-xl shadow-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Default Currency
                  </p>
                  <p className="font-semibold uppercase">{selectedUser.currency || "INR"}</p>
                </div>
                <div className="bg-card border p-4 rounded-xl shadow-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5" /> Last Active
                  </p>
                  <p className="font-semibold">{selectedUser.lastActiveDate ? formatDate(selectedUser.lastActiveDate, "standard", userTimezone) : "N/A"}</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-card border p-4 rounded-xl shadow-sm">
                <span className="font-medium text-foreground">Account Status</span>
                <div className="flex items-center gap-2">
                  <span className={selectedUser.isActive !== false ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                    {selectedUser.isActive !== false ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={selectedUser.isActive !== false}
                    onChange={(checked) => {
                      handleToggle(selectedUser._id, !checked);
                      setSelectedUser({ ...selectedUser, isActive: checked });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
