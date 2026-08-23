"use client";

import React, { useState, useMemo } from "react";
import { Table, Button, Modal, Badge, Select } from "antd";
import { Input } from "@/components/ui/input";
import { parseToDate } from "@/lib/dateTimeHelper";
import { formatDate } from "@/lib/helpers";
import { Eye, History, ArrowRight, Calendar, Hash, Layers, Activity, Search, Filter } from "lucide-react";

export function AuditLogsList({ logs, userTimezone }: { logs: any[]; userTimezone: string }) {
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");

  const getFriendlyEntityName = (log: any) => {
    if (log.entityName) return log.entityName;
    const data = log.currentValue || log.previousValue || {};
    return data.name || data.title || data.policyName || data.cardName || data.bankName || data.description || data.note || `ID: ${log.entityId}`;
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
      sorter: (a: any, b: any) => parseToDate(a.createdAt).getTime() - parseToDate(b.createdAt).getTime(),
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

  const getActionStyle = (action: string) => {
    if (action === "CREATE") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (action === "DELETE") return "bg-red-500/10 text-red-600 border-red-500/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const entityName = getFriendlyEntityName(log).toLowerCase();
      
      const matchesSearch = entityName.includes(q);
      const matchesType = typeFilter === "All" || log.entityType === typeFilter;
      const matchesAction = actionFilter === "All" || log.action === actionFilter;
      
      return matchesSearch && matchesType && matchesAction;
    });
  }, [logs, searchQuery, typeFilter, actionFilter]);

  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 10;
  const totalPages = Math.ceil(filteredLogs.length / mobilePageSize);
  const pagedLogs = filteredLogs.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by entity name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onChange={setTypeFilter} className="w-full md:w-40" options={[{label: "All Types", value: "All"}, {label: "Transaction", value: "Transaction"}, {label: "Category", value: "Category"}, {label: "Account", value: "Account"}, {label: "Person", value: "Person"}, {label: "CreditCard", value: "CreditCard"}, {label: "Budget", value: "Budget"}]} />
        <Select value={actionFilter} onChange={setActionFilter} className="w-full md:w-40" options={[{label: "All Actions", value: "All"}, {label: "Create", value: "CREATE"}, {label: "Update", value: "UPDATE"}, {label: "Delete", value: "DELETE"}]} />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="_id"
          pagination={{ pageSize: 15, position: ["bottomRight"], showSizeChanger: true }}
          className="audit-logs-table"
          locale={{ emptyText: "No audit logs found." }}
        />
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {pagedLogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No audit logs found.</div>
        )}
        {pagedLogs.map((log: any) => (
          <button
            key={log._id}
            onClick={() => setSelectedLog(log)}
            className="w-full text-left p-4 rounded-2xl border bg-card hover:bg-secondary/20 transition-all active:scale-[0.98] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getActionStyle(log.action)}`}>
                {log.action}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-foreground border">
                {log.entityType}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground truncate">{getFriendlyEntityName(log)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.createdAt, "standard", userTimezone)}</p>
            </div>
          </button>
        ))}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 pb-1">
            <button
              onClick={() => setMobilePage(p => Math.max(1, p - 1))}
              disabled={mobilePage === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-card disabled:opacity-40 hover:bg-secondary/50 transition-colors"
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {mobilePage} / {totalPages}
            </span>
            <button
              onClick={() => setMobilePage(p => Math.min(totalPages, p + 1))}
              disabled={mobilePage === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-card disabled:opacity-40 hover:bg-secondary/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {(() => {
        const changes = selectedLog ? getChangedProperties(selectedLog.previousValue, selectedLog.currentValue) : [];
        return (
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
            <Button key="close" onClick={() => setSelectedLog(null)} className="rounded-xl px-5">
              Close
            </Button>
          ]}
          width={800}
          className="audit-log-modal"
          centered
        >
          {selectedLog && (
            <div className="space-y-6 pt-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-secondary/30 rounded-2xl border text-sm">
                <div className="flex gap-2.5 items-start">
                  <Calendar className="w-4 h-4 text-muted-foreground/75 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timestamp</p>
                    <p className="font-semibold text-foreground mt-0.5">{formatDate(selectedLog.createdAt, "standard", userTimezone)}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Hash className="w-4 h-4 text-muted-foreground/75 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity ID</p>
                    <p className="font-mono text-xs text-foreground mt-1 break-all">{selectedLog.entityId}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Layers className="w-4 h-4 text-muted-foreground/75 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity Type</p>
                    <p className="mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border">
                        {selectedLog.entityType}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Activity className="w-4 h-4 text-muted-foreground/75 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Action Type</p>
                    <p className="mt-1">
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
                    <div className="border border-border/50 rounded-2xl overflow-hidden shadow-inner">
                      <div className="grid grid-cols-3 bg-muted/50 p-3.5 text-xs font-bold text-muted-foreground border-b uppercase tracking-wider">
                        <div>Property</div>
                        <div>Previous Value</div>
                        <div>Current Value</div>
                      </div>
                      <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto bg-card">
                        {changes.map((c) => (
                          <div key={c.key} className="grid grid-cols-3 p-3.5 items-center text-sm gap-2 hover:bg-secondary/10 transition-colors">
                            <div className="font-semibold text-foreground capitalize">{c.key}</div>
                            <div className="break-all pr-2">
                              {c.prev === undefined || c.prev === null ? (
                                <span className="text-muted-foreground/50 italic text-xs">None</span>
                              ) : (
                                <span className="inline-block px-2.5 py-1.5 rounded-xl text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-medium line-through decoration-rose-500/30">
                                  {typeof c.prev === "object" ? JSON.stringify(c.prev) : String(c.prev)}
                                </span>
                              )}
                            </div>
                            <div className="break-all flex items-center gap-1.5">
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                              {c.curr === undefined || c.curr === null ? (
                                <span className="text-muted-foreground/50 italic text-xs">None</span>
                              ) : (
                                <span className="inline-block px-2.5 py-1.5 rounded-xl text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                  {typeof c.curr === "object" ? JSON.stringify(c.curr) : String(c.curr)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">No properties were modified.</p>
                  )
                ) : (
                  <div className="border border-border/50 rounded-2xl overflow-hidden shadow-inner">
                    <div className="grid grid-cols-2 bg-muted/50 p-3.5 text-xs font-bold text-muted-foreground border-b uppercase tracking-wider">
                      <div>Property</div>
                      <div>Value</div>
                    </div>
                    <div className="divide-y divide-border/40 max-h-[350px] overflow-y-auto bg-card">
                      {Object.entries(selectedLog.currentValue || selectedLog.previousValue || {}).map(([key, val]) => {
                        if (["_id", "userId", "createdAt", "updatedAt", "__v", "id"].includes(key)) return null;
                        return (
                          <div key={key} className="grid grid-cols-2 p-3.5 items-center text-sm gap-2 hover:bg-secondary/10 transition-colors">
                            <div className="font-semibold text-foreground capitalize">{key}</div>
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
        );
      })()}
    </div>
  );
}
