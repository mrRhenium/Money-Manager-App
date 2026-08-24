"use client";

import { useState, useMemo } from "react";
import { Table, Select as AntSelect } from "antd";
import { Button } from "@/components/ui/button";
import { Eye, Search, Filter, Trash } from "lucide-react";
import { formatDateString } from "@/lib/dateTimeHelper";
import Link from "next/link";
import { InvestmentForm } from "../forms/InvestmentForm";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import { Input } from "@/components/ui/input";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { deleteInvestment } from "@/actions/investment";

export function InvestmentTable({ investments, accounts }: { investments: any[], accounts: any[] }) {
  const { format } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const { hiddenIds, triggerDelete } = useUndoableDelete();

  const filteredAndSortedInvestments = useMemo(() => {
    let result = [...investments].filter(i => !hiddenIds.has(i._id));

    // Filter by status
    if (statusFilter === "active") {
      result = result.filter(i => i.status === "active");
    } else if (statusFilter === "closed") {
      result = result.filter(i => i.status === "closed" || i.status === "sold" || i.status === "matured");
    }

    // Filter by type
    if (typeFilters.length > 0) {
      result = result.filter(i => typeFilters.includes(i.investmentType));
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.ticker && i.ticker.toLowerCase().includes(q)) ||
          (i.platform && i.platform.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest_value") return (b.currentValue || 0) - (a.currentValue || 0);
      if (sortBy === "lowest_value") return (a.currentValue || 0) - (b.currentValue || 0);
      if (sortBy === "highest_return") {
        const retA = (a.currentValue || 0) - (a.investedAmount || 0);
        const retB = (b.currentValue || 0) - (b.investedAmount || 0);
        return retB - retA;
      }
      return 0;
    });

    return result;
  }, [investments, searchQuery, statusFilter, typeFilters, sortBy, hiddenIds]);

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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${record.status !== "active" ? "opacity-50 grayscale" : ""}`} style={{ backgroundColor: `${record.color || '#8b5cf6'}15` }}>
            <CategoryIcon name={record.icon} color={record.color} className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {name}
              {record.status !== "active" && (
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground uppercase">{record.status}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex flex-col">
              <span>{record.investmentType} {record.platform ? `• ${record.platform}` : ""}</span>
              {(record.units || record.interestRate || record.maturityDate) && (
                <span className="text-[10.5px] mt-0.5 font-medium opacity-85">
                    {record.investmentType === "FD" || record.investmentType === "RD" || record.investmentType === "Bonds" ? (
                      <>
                        {record.interestRate ? `${record.interestRate}% interest` : ""}
                        {record.interestRate && record.maturityDate ? " • " : ""}
                        {record.maturityDate ? `Matures: ${formatDateString(record.maturityDate, "MMM DD, YYYY")}` : ""}
                      </>
                    ) : (
                      <>
                        {record.units ? `${record.units} units` : ""}
                      </>
                    )}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Latest Price",
      key: "currentPrice",
      render: (_: any, record: any) => {
        if (!record.currentPrice) return <span className="text-muted-foreground text-xs opacity-50">-</span>;
        return (
          <div className={record.status !== "active" ? "opacity-60" : ""}>
            <span className="font-medium">{format(record.currentPrice)}</span>
            <div className="text-[10px] text-muted-foreground">{record.investmentType === "MutualFund" || record.investmentType === "SIP" ? "NAV" : "Price"}</div>
          </div>
        );
      }
    },
    {
      title: "Invested",
      dataIndex: "investedAmount",
      key: "investedAmount",
      render: (amount: number, record: any) => <span className={record.status !== "active" ? "opacity-60" : ""}>{format(amount)}</span>,
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      render: (amount: number, record: any) => (
        <div className={record.status !== "active" ? "opacity-60" : ""}>
          <span className="font-medium">{format(amount)}</span>
          {record.autoPriceUpdateEnabled && record.lastAutoUpdatedAt && record.status === "active" && (
            <div className="text-[10px] text-muted-foreground" title={formatDateString(record.lastAutoUpdatedAt, "YYYY-MM-DD HH:mm")}>
              Auto-synced
            </div>
          )}
          {record.autoPriceUpdateEnabled && !record.lastAutoUpdatedAt && record.status === "active" && (
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
          <div className={`flex flex-col gap-0.5 ${record.status !== "active" ? "opacity-60" : ""} ${isPos ? "text-emerald-500" : isNeg ? "text-red-500" : "text-muted-foreground"}`}>
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            onClick={() => {
              triggerDelete({
                id: record._id,
                entityName: record.name,
                onCommit: async () => {
                  const res = await deleteInvestment(record._id);
                  if (res && !res.success) {
                    throw new Error(res.error);
                  }
                }
              });
            }}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const typeOptions = Array.from(new Set(investments.map(i => i.investmentType))).map(type => ({ label: type, value: type }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 bg-card p-3 rounded-xl border shadow-sm mt-4 mb-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, platform, or ticker..."
            className="pl-9 bg-background h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <AntSelect
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "Active", value: "active" },
            { label: "Closed/Sold", value: "closed" },
            { label: "All", value: "all" },
          ]}
        />
        
        <AntSelect
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="All Types"
          className="w-full min-h-10"
          popupMatchSelectWidth={false}
          value={typeFilters}
          onChange={setTypeFilters}
          options={typeOptions}
          optionRender={(option) => (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={typeFilters.includes(option.value as string)} readOnly className="cursor-pointer" />
              <span>{option.label}</span>
            </div>
          )}
        />
        
        <AntSelect
          value={sortBy}
          onChange={setSortBy}
          className="w-full h-10"
          popupMatchSelectWidth={false}
          options={[
            { label: "✨ Newest First", value: "newest" },
            { label: "🕒 Oldest First", value: "oldest" },
            { label: "📈 Highest Value", value: "highest_value" },
            { label: "📉 Lowest Value", value: "lowest_value" },
            { label: "🚀 Highest Return", value: "highest_return" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredAndSortedInvestments.map(record => {
          const ret = (record.currentValue || 0) - (record.investedAmount || 0);
          const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
          const isPos = ret > 0;
          const isNeg = ret < 0;
          const isClosed = record.status !== "active";

          return (
            <div key={record._id} className={`bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-4 ${isClosed ? "opacity-75" : ""}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner ${isClosed ? "grayscale" : ""}`}
                    style={{ backgroundColor: record.color || '#8b5cf6' }}
                  >
                    <CategoryIcon name={record.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-tight truncate flex items-center gap-2">
                      {record.name}
                      {isClosed && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground uppercase font-normal">{record.status}</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {record.investmentType}
                      {record.platform ? ` • ${record.platform}` : ""}
                    </p>
                    {(record.units || record.interestRate || record.maturityDate) && (
                      <p className="text-[10px] mt-0.5 font-medium opacity-85 text-muted-foreground truncate">
                        {record.investmentType === "FD" || record.investmentType === "RD" || record.investmentType === "Bonds" ? (
                          <>
                            {record.interestRate ? `${record.interestRate}% interest` : ""}
                            {record.interestRate && record.maturityDate ? " • " : ""}
                            {record.maturityDate ? `Matures: ${formatDateString(record.maturityDate, "MMM DD, YYYY")}` : ""}
                          </>
                        ) : (
                          <>
                            {record.units ? `${record.units} units` : ""}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                  <Link href={`/investments/${record._id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <InvestmentForm investment={record} accounts={accounts} triggerClassName="h-8 w-8 rounded-full" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    onClick={() => {
                      triggerDelete({
                        id: record._id,
                        entityName: record.name,
                        onCommit: async () => {
                          const res = await deleteInvestment(record._id);
                          if (res && !res.success) {
                            throw new Error(res.error);
                          }
                        }
                      });
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-border/50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Invested</p>
                  <p className="font-semibold text-sm">{format(record.investedAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Latest Price</p>
                  <p className="font-semibold text-sm">{record.currentPrice ? format(record.currentPrice) : "-"}</p>
                </div>
                <div className="col-span-2 pt-2 mt-2 border-t border-border/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Current Value</p>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{format(record.currentValue)}</span>
                        {record.autoPriceUpdateEnabled && record.lastAutoUpdatedAt && !isClosed && (
                          <span className="text-[10px] text-muted-foreground">Auto-synced</span>
                        )}
                        {record.autoPriceUpdateEnabled && !record.lastAutoUpdatedAt && !isClosed && (
                          <span className="text-[10px] text-amber-500">Pending sync</span>
                        )}
                      </div>
                    </div>
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
                className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none ${isClosed ? "grayscale" : ""}`}
                style={{ backgroundColor: record.color || '#8b5cf6' }}
              />
            </div>
          );
        })}
        {filteredAndSortedInvestments.length === 0 && (
          <div className="p-8 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">No investments match your filters.</p>
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredAndSortedInvestments.map(inv => ({ ...inv, key: inv._id }))}
          pagination={{ pageSize: 10 }}
          className="custom-table"
        />
      </div>
    </>
  );
}
