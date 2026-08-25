"use client";

import React, { useState, useMemo } from "react";
import { Table, Badge, Select } from "antd";
import { Input } from "@/components/ui/input";
import { Button as UiButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseToDate } from "@/lib/dateTimeHelper";
import { formatDate } from "@/lib/helpers";
import { Eye, History, ArrowRight, Calendar, Hash, Layers, Activity, Search, Filter } from "lucide-react";
import { MasterToolbar, MasterViewLayout, MasterFilterSidebar, MasterFilterDrawer, MasterSearchField } from "@/components/layout/MasterView";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AuditLogsList({ logs, userTimezone }: { logs: any[]; userTimezone: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState<string[]>(searchParams.get("types") ? searchParams.get("types")!.split(",") : []);
  const [actionFilter, setActionFilter] = useState<string[]>(searchParams.get("actions") ? searchParams.get("actions")!.split(",") : []);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    
    if (searchQuery) current.set("q", searchQuery);
    else current.delete("q");

    if (typeFilter.length > 0) current.set("types", typeFilter.join(","));
    else current.delete("types");

    if (actionFilter.length > 0) current.set("actions", actionFilter.join(","));
    else current.delete("actions");

    const search = current.toString();
    const query = search ? `?${search}` : "";
    window.history.replaceState(null, '', `${pathname}${query}`);
  }, [searchQuery, typeFilter, actionFilter, pathname]);

  const isFilterActive = searchQuery !== "" || typeFilter.length > 0 || actionFilter.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter([]);
    setActionFilter([]);
  };

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

  const getColumnSearchProps = (title: string, renderText: (record: any) => string) => ({
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
          <UiButton variant="ghost" size="sm" onClick={() => clearFilters && clearFilters()} className="h-8 px-3 text-xs">
            Reset
          </UiButton>
          <UiButton variant="default" size="sm" onClick={() => confirm()} className="h-8 px-3 text-xs">
            Search
          </UiButton>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <Search className={`w-4 h-4 ${filtered ? 'text-primary' : 'text-muted-foreground'}`} />
    ),
    onFilter: (value: any, record: any) => {
      const text = renderText(record);
      return text ? text.toString().toLowerCase().includes((value as string).toLowerCase()) : false;
    },
  });

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
            text={<span className="font-semibold text-xs tracking-wide text-foreground dark:text-white">{action}</span>} 
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
      ...getColumnSearchProps("Master Value", (record) => getFriendlyEntityName(record)),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <UiButton 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setSelectedLog(record)}
        >
          <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </UiButton>
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
      const matchesType = typeFilter.length === 0 || typeFilter.includes(log.entityType);
      const matchesAction = actionFilter.length === 0 || actionFilter.includes(log.action);
      
      return matchesSearch && matchesType && matchesAction;
    });
  }, [logs, searchQuery, typeFilter, actionFilter]);

  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 10;
  const totalPages = Math.ceil(filteredLogs.length / mobilePageSize);
  const pagedLogs = filteredLogs.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize);

  const filterContent = (
    <div className="space-y-6">
      <MasterSearchField searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search by entity name..." />

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Type</h3>
        <Select 
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Types"
          value={typeFilter} 
          onChange={setTypeFilter} 
          className="w-full min-h-10" 
          popupMatchSelectWidth={false}
          options={[{label: "Transaction", value: "Transaction"}, {label: "Category", value: "Category"}, {label: "Account", value: "Account"}, {label: "Person", value: "Person"}, {label: "CreditCard", value: "CreditCard"}, {label: "Budget", value: "Budget"}]} 
        />
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Action</h3>
        <Select 
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Actions"
          value={actionFilter} 
          onChange={setActionFilter} 
          className="w-full min-h-10" 
          popupMatchSelectWidth={false}
          options={[{label: "Create", value: "CREATE"}, {label: "Update", value: "UPDATE"}, {label: "Delete", value: "DELETE"}]} 
        />
      </div>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col h-full overflow-hidden">
      <MasterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => setMobileFilterOpen(true)}
        isFilterActive={isFilterActive}
        tabs={[]} // No tabs needed
        activeTab="logs"
        onTabChange={() => {}}
        searchPlaceholder="Search logs..."
      />
      


      <MasterViewLayout sidebar={
        <MasterFilterSidebar 
          isFilterActive={isFilterActive} 
          onClearFilters={clearFilters}
        >
          {filterContent}
        </MasterFilterSidebar>
      }>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="_id"
          pagination={{ defaultPageSize: 10, position: ["bottomRight"], showSizeChanger: true }}
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
        <Dialog
          open={!!selectedLog}
          onOpenChange={(open) => {
            if (!open) setSelectedLog(null);
          }}
        >
          <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2 border-b border-border pb-3">
                <History className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg text-foreground">Audit Log Details</span>
              </DialogTitle>
            </DialogHeader>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                    <p className="font-semibold text-foreground mt-1">{selectedLog.entityType}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <Activity className="w-4 h-4 text-muted-foreground/75 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Action</p>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getActionStyle(selectedLog.action)}`}>
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
          </DialogContent>
        </Dialog>
        );
      })()}
      
      </MasterViewLayout>
      <MasterFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        isFilterActive={isFilterActive}
        onClearFilters={clearFilters}
      >
        {filterContent}
      </MasterFilterDrawer>
    </div>
  );
}
