"use client";

import { deleteInsurancePolicy } from "@/actions/insurance";
import { Search, SlidersHorizontal, Eye, Trash } from "lucide-react";
import { Input, Select, List } from "antd";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InsuranceForm } from "../forms/InsuranceForm";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDateString } from "@/lib/dateTimeHelper";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";

export function InsuranceTable({ 
  policies, 
  accounts,
  hideToolbar = false,
  externalSort = "",
  externalSearch = "",
  externalType = "all"
}: { 
  policies: any[]; 
  accounts: any[];
  hideToolbar?: boolean;
  externalSort?: string;
  externalSearch?: string;
  externalType?: string;
}) {
  const { format } = useCurrency();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { hiddenIds, triggerDelete } = useUndoableDelete();

  const filteredAndSorted = useMemo(() => {
    let result = [...policies];
    
    // Status filter - only active by default unless we add a status dropdown
    // Let's filter out non-active if we don't want to show them, but for now we show all
    result = result.filter(p => p.status !== "mistake" && !hiddenIds.has(p._id));

    const currentSearch = hideToolbar ? externalSearch : search;
    const currentType = hideToolbar ? externalType : filterType;
    const currentSort = hideToolbar ? externalSort : sortBy;

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      result = result.filter(p => 
        p.policyName?.toLowerCase().includes(q) || 
        p.provider?.toLowerCase().includes(q) ||
        p.policyNumber?.toLowerCase().includes(q)
      );
    }
    if (currentType !== "all") {
      result = result.filter(p => p.type === currentType);
    }

    result.sort((a, b) => {
      if (currentSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (currentSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (currentSort === "highest_coverage") return (b.coverageAmount || 0) - (a.coverageAmount || 0);
      if (currentSort === "highest_premium") return (b.premiumAmount || 0) - (a.premiumAmount || 0);
      return 0;
    });

    return result;
  }, [policies, search, filterType, sortBy, hiddenIds, hideToolbar, externalSearch, externalType, externalSort]);


  return (
    <>
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-card p-3 rounded-xl border shadow-sm items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, provider, or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-input"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            <Select 
              value={filterType}
              onChange={setFilterType}
              className="w-full sm:min-w-[130px] h-10"
              options={[
                { label: "All Types", value: "all" },
                { label: "Life", value: "Life" },
                { label: "Health", value: "Health" },
                { label: "Vehicle", value: "Vehicle" },
                { label: "Home", value: "Home" },
                { label: "Travel", value: "Travel" },
                { label: "Other", value: "Other" },
              ]}
            />
            <Select 
              value={sortBy}
              onChange={setSortBy}
              className="w-full sm:min-w-[150px] h-10"
              options={[
                { label: "✨ Newest First", value: "newest" },
                { label: "🕒 Oldest First", value: "oldest" },
                { label: "📈 Highest Coverage", value: "highest_coverage" },
                { label: "💵 Highest Premium", value: "highest_premium" },
              ]}
            />
          </div>
        </div>
      )}

      <div className="pt-2 pb-4">
        <List
          grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={filteredAndSorted}
          pagination={{ pageSize: 9, position: "bottom", align: "end" }}
          renderItem={(record: any) => (
            <List.Item className="h-full !mb-0 block">
              <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col gap-4 h-full justify-between">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner" 
                      style={{ backgroundColor: record.color || '#10b981' }}
                    >
                      <CategoryIcon name={record.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate">{record.policyName}</h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{record.provider} ({record.type})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                    <Link href={`/insurance/${record._id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <InsuranceForm policy={record} accounts={accounts} />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      onClick={() => {
                        triggerDelete({
                          id: record._id,
                          entityName: record.policyName,
                          onCommit: async () => {
                            const res = await deleteInsurancePolicy(record._id);
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
  
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-border/50 mt-auto">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Coverage</p>
                    <p className="font-semibold text-sm">{format(record.coverageAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Premium</p>
                    <p className="font-semibold text-sm">{format(record.premiumAmount)} <span className="text-xs text-muted-foreground font-normal">/ {record.premiumFrequency}</span></p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Next Renewal</p>
                    <p className="font-medium text-sm">{record.renewalDate ? formatDateString(record.renewalDate, "DD-MM-YYYY") : "-"}</p>
                  </div>
                </div>
  
                {/* Decorative background circle */}
                <div 
                  className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                  style={{ backgroundColor: record.color || '#10b981' }}
                />
              </div>
            </List.Item>
          )}
        />
      </div>
    </>
  );
}
