"use client";

import React, { useState } from "react";
import { Table, Button, Modal, Badge } from "antd";
import { formatDate } from "@/lib/helpers";
import { Eye, History, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AuditLogsList({ logs, userTimezone }: { logs: any[]; userTimezone: string }) {
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const getFriendlyEntityName = (log: any) => {
    const data = log.currentValue || log.previousValue || {};
    return data.name || data.note || data.bankName || `ID: ${log.entityId}`;
  };

  const getChangedProperties = (prev: any, curr: any) => {
    const p = prev || {};
    const c = curr || {};
    const allKeys = Array.from(new Set([...Object.keys(p), ...Object.keys(c)]));
    
    const ignoredKeys = ["_id", "userId", "createdAt", "updatedAt", "__v", "id"];
    const changes: { key: string; prev: any; curr: any }[] = [];

    allKeys.forEach((key) => {
      if (ignoredKeys.includes(key)) return;
      
      const prevVal = p[key];
      const currVal = c[key];

      if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
        changes.push({
          key,
          prev: prevVal,
          curr: currVal,
        });
      }
    });

    return changes;
  };

  const renderValue = (val: any) => {
    if (val === undefined || val === null) {
      return <span className="text-muted-foreground italic">None</span>;
    }
    if (typeof val === "boolean") {
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${val ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
          {val ? "True" : "False"}
        </span>
      );
    }
    if (typeof val === "object") {
      return <pre className="text-xs bg-muted p-1.5 rounded overflow-x-auto max-w-[200px]">{JSON.stringify(val, null, 2)}</pre>;
    }
    return <span className="font-mono text-xs">{String(val)}</span>;
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => <span className="whitespace-nowrap font-medium">{formatDate(date, "standard", userTimezone)}</span>,
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        let color = "blue";
        if (action === "CREATE") color = "success";
        if (action === "DELETE") color = "error";
        return (
          <Badge 
            status={color as any} 
            text={<span className="font-semibold text-xs tracking-wide">{action}</span>} 
          />
        );
      },
      filters: [
        { text: "CREATE", value: "CREATE" },
        { text: "UPDATE", value: "UPDATE" },
        { text: "DELETE", value: "DELETE" },
      ],
      onFilter: (value: any, record: any) => record.action === value,
    },
    {
      title: "Entity Type",
      dataIndex: "entityType",
      key: "entityType",
      render: (type: string) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border">
          {type}
        </span>
      ),
      filters: [
        { text: "Transaction", value: "Transaction" },
        { text: "Category", value: "Category" },
        { text: "Account", value: "Account" },
        { text: "Person", value: "Person" },
        { text: "CreditCard", value: "CreditCard" },
        { text: "Budget", value: "Budget" },
      ],
      onFilter: (value: any, record: any) => record.entityType === value,
    },
    {
      title: "Master Value",
      key: "masterValue",
      render: (_: any, record: any) => (
        <span className="font-medium text-foreground max-w-[200px] truncate block">
          {getFriendlyEntityName(record)}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button 
          type="text" 
          size="small" 
          onClick={() => setSelectedLog(record)}
          icon={<Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />} 
        />
      ),
    }
  ];

  const changes = selectedLog ? getChangedProperties(selectedLog.previousValue, selectedLog.currentValue) : [];

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          pagination={{ pageSize: 15, position: ["bottomRight"], showSizeChanger: true }}
          className="border-none"
          locale={{ emptyText: "No audit logs found." }}
        />

        <Modal
          title={
            <div className="flex items-center gap-2 border-b pb-3 pr-6">
              <History className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">Audit Log Details</span>
            </div>
          }
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedLog(null)} className="rounded-xl">
              Close
            </Button>
          ]}
          width={650}
          className="audit-log-modal"
          centered
        >
          {selectedLog && (
            <div className="space-y-6 pt-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-2xl border border-border/40 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timestamp</p>
                  <p className="font-medium text-foreground mt-0.5">{formatDate(selectedLog.createdAt, "standard", userTimezone)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity ID</p>
                  <p className="font-mono text-xs text-foreground mt-1 break-all">{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity Type</p>
                  <p className="mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border">
                      {selectedLog.entityType}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Action Type</p>
                  <p className="mt-0.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedLog.action === "CREATE" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                      selectedLog.action === "DELETE" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                      "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                    }`}>
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
              </div>

              {/* Snapshot / Changes Section */}
              <div>
                <h4 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wider">
                  {selectedLog.action === "CREATE" ? "Created Record Values" :
                   selectedLog.action === "DELETE" ? "Deleted Record Values" :
                   "Modified Fields comparison"}
                </h4>

                {selectedLog.action === "UPDATE" ? (
                  changes.length > 0 ? (
                    <div className="border border-border/50 rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-3 bg-muted/60 p-3 text-xs font-bold text-muted-foreground border-b uppercase tracking-wider">
                        <div>Property</div>
                        <div>Previous Value</div>
                        <div>Current Value</div>
                      </div>
                      <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto">
                        {changes.map((c) => (
                          <div key={c.key} className="grid grid-cols-3 p-3 items-center text-sm gap-2">
                            <div className="font-medium text-foreground capitalize">{c.key}</div>
                            <div className="break-all pr-2">{renderValue(c.prev)}</div>
                            <div className="break-all flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                              {renderValue(c.curr)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">No properties were modified.</p>
                  )
                ) : (
                  <div className="border border-border/50 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-2 bg-muted/60 p-3 text-xs font-bold text-muted-foreground border-b uppercase tracking-wider">
                      <div>Property</div>
                      <div>Value</div>
                    </div>
                    <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto">
                      {Object.entries(selectedLog.currentValue || selectedLog.previousValue || {}).map(([key, val]) => {
                        if (["_id", "userId", "createdAt", "updatedAt", "__v", "id"].includes(key)) return null;
                        return (
                          <div key={key} className="grid grid-cols-2 p-3 items-center text-sm gap-2">
                            <div className="font-medium text-foreground capitalize">{key}</div>
                            <div className="break-all">{renderValue(val)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </CardContent>
    </Card>
  );
}
