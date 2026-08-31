"use client";

import React, { useState, useMemo } from "react";
import { List } from "antd";
import { TrendingUp, RefreshCw, Eye, Trash, Filter, Search } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select as AntSelect } from "antd";
import { InvestmentForm } from "@/components/forms/InvestmentForm";
import { InvestmentDeleteModal } from "@/components/forms/InvestmentDeleteModal";
import { useCurrency } from "@/hooks/useCurrency";
import { parseToDate, formatDateString } from "@/lib/dateTimeHelper";
import Link from "next/link";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

export function InvestmentList({ 
  investments, 
  accounts,
  hideToolbar = false,
  externalSearch = "",
  externalSort = "newest",
  externalStatus = "active",
  externalTypes = [] as string[]
}: { 
  investments: any[];
  accounts: any[];
  hideToolbar?: boolean;
  externalSearch?: string;
  externalSort?: string;
  externalStatus?: string;
  externalTypes?: string[];
}) {
  const { format } = useCurrency();

  const [internalSearch, setInternalSearch] = useState("");
  const [internalSort, setInternalSort] = useState("newest");
  const [internalStatus, setInternalStatus] = useState("active");
  const [internalTypes, setInternalTypes] = useState<string[]>([]);

  const searchQuery = hideToolbar ? externalSearch : internalSearch;
  const sortBy = hideToolbar ? externalSort : internalSort;
  const statusFilter = hideToolbar ? externalStatus : internalStatus;
  const typeFilters = hideToolbar ? externalTypes : internalTypes;

  const filteredAndSortedInvestments = useMemo(() => {
    let result = [...investments];

    if (statusFilter === "active") result = result.filter(i => i.status === "active");
    else if (statusFilter === "closed") result = result.filter(i => i.status === "closed" || i.status === "sold" || i.status === "matured");

    if (typeFilters.length > 0) result = result.filter(i => typeFilters.includes(i.investmentType));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.ticker && i.ticker.toLowerCase().includes(q)) || (i.platform && i.platform.toLowerCase().includes(q))
      );
    }

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
  }, [investments, searchQuery, statusFilter, typeFilters, sortBy]);

  const typeOptions = Array.from(new Set(investments.map(i => i.investmentType))).map(type => ({ label: type, value: type }));

  return (
    <div className="w-full space-y-4">
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ticker..."
              className="pl-9 bg-background"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:w-[400px]">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <AntSelect
              className="flex-1 h-10"
              value={internalStatus}
              onChange={setInternalStatus}
              options={[
                { label: "Active", value: "active" },
                { label: "Closed/Sold", value: "closed" },
                { label: "All", value: "all" },
              ]}
            />
            <AntSelect
              className="flex-1 h-10"
              value={internalSort}
              onChange={setInternalSort}
              options={[
                { label: "✨ Newest First", value: "newest" },
                { label: "🕒 Oldest First", value: "oldest" },
                { label: "📈 Highest Value", value: "highest_value" },
                { label: "📉 Lowest Value", value: "lowest_value" },
                { label: "🚀 Highest Return", value: "highest_return" },
              ]}
            />
          </div>
        </div>
      )}

      {filteredAndSortedInvestments.length > 0 ? (
        <div className="pt-2 pb-4">
          <List
            grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 3 }}
            dataSource={filteredAndSortedInvestments}
            pagination={{ pageSize: 12, position: "bottom", align: "end" }}
            renderItem={(record: any) => {
              const ret = (record.currentValue || 0) - (record.investedAmount || 0);
              const retPct = record.investedAmount > 0 ? (ret / record.investedAmount) * 100 : 0;
              const isPos = ret > 0;
              const isNeg = ret < 0;
              const isClosed = record.status !== "active";

              return (
                <List.Item className="h-full !mb-0 block">
                  <div className={`bg-card text-card-foreground border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-4 h-full justify-between ${isClosed ? "opacity-75" : ""}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner ${isClosed ? "grayscale" : ""}`}
                          style={{ backgroundColor: record.color || '#8b5cf6' }}
                        >
                          <CategoryIcon name={record.icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn(TYPOGRAPHY.cardTitle, "leading-none mb-1 flex items-center gap-2")}>
                            <span className="truncate min-w-0">{record.name}</span>
                          </h3>
                          <p className={cn(TYPOGRAPHY.cardSubtitle, "mt-0.5")}>
                            {record.investmentType}
                            {record.platform ? ` • ${record.platform}` : ""}
                          </p>
                          {(record.units || record.interestRate || record.maturityDate) && (
                            <p className={cn(TYPOGRAPHY.cardLabel, "mt-1 font-medium opacity-85")}>
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
                      <div className="flex flex-col items-end shrink-0 -mt-1 -mr-1">
                        <div className="flex items-center gap-1">
                          <Link href={`/investments/${record._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <InvestmentForm investment={record} accounts={accounts} triggerClassName="h-8 w-8 rounded-full" />
                          <InvestmentDeleteModal investment={record} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5 mt-1 mr-1">
                          {isClosed && <span className={cn(TYPOGRAPHY.badge, "bg-secondary text-muted-foreground")}>{record.status}</span>}
                          {record.autoPriceUpdateEnabled && !record.lastAutoUpdatedAt && !isClosed && (
                            <span className={cn(TYPOGRAPHY.badge, "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800 flex items-center gap-1")}><RefreshCw className="w-3 h-3" /> Pending</span>
                          )}
                          {record.autoPriceUpdateEnabled && record.lastAutoUpdatedAt && !isClosed && (
                            <span className={cn(TYPOGRAPHY.badge, "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1")}><RefreshCw className="w-3 h-3" /> Synced</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-5 gap-x-2 pt-5 border-t border-slate-100 dark:border-slate-800 mt-auto z-10 relative">
                      <div>
                        <p className={cn(TYPOGRAPHY.cardLabel, "mb-1")}>Invested</p>
                        <p className={cn(TYPOGRAPHY.cardValue, "font-semibold")}>{format(record.investedAmount)}</p>
                      </div>
                      <div>
                        <p className={cn(TYPOGRAPHY.cardLabel, "mb-1")}>Latest Price</p>
                        <p className={cn(TYPOGRAPHY.cardValue, "font-semibold")}>{record.currentPrice ? format(record.currentPrice) : "-"}</p>
                      </div>
                      <div className="col-span-2 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={cn(TYPOGRAPHY.cardLabel, "mb-1")}>Current Value</p>
                            <span className={cn(TYPOGRAPHY.cardValue, "font-bold text-foreground")}>{format(record.currentValue)}</span>
                          </div>
                          <div>
                            <p className={cn(TYPOGRAPHY.cardLabel, "mb-1 text-right")}>Returns</p>
                            <div className={cn(TYPOGRAPHY.cardValue, "flex items-center gap-2 font-bold justify-end", isPos ? "text-emerald-500" : isNeg ? "text-red-500" : "text-muted-foreground")}>
                              <span>{isPos ? "+" : ""}{format(ret)}</span>
                              <span className={cn(TYPOGRAPHY.badge, "bg-current/10")}>{isPos ? "+" : ""}{retPct.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative background circle */}
                    <div
                      className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none ${isClosed ? "grayscale" : ""}`}
                      style={{ backgroundColor: record.color || '#8b5cf6' }}
                    />
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      ) : (
        <div className="text-center p-16 border rounded-2xl border-dashed bg-card shadow-sm">
          <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No investments match your filters</h3>
          <p className="text-muted-foreground mb-6">Try clearing your filters to see all your data.</p>
        </div>
      )}
    </div>
  );
}
