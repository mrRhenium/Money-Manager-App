"use client";

import { List, Tabs } from "antd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryForm } from "../forms/CategoryForm";
import { deleteCategory } from "@/actions/category";
import { Trash, Search } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useState, useMemo } from "react";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";

export function CategoryList({ 
  expenseCategories, 
  incomeCategories,
  hideToolbar,
  externalType = "expense",
  externalSearch = ""
}: { 
  expenseCategories: any[];
  incomeCategories: any[];
  hideToolbar?: boolean;
  externalType?: string;
  externalSearch?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("expense");
  const { hiddenIds, triggerDelete } = useUndoableDelete();

  const filteredExpenses = useMemo(() => {
    return expenseCategories.filter(cat => {
      if (hiddenIds.has(cat._id)) return false;
      const search = hideToolbar ? externalSearch : searchQuery;
      return cat.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [expenseCategories, searchQuery, hiddenIds, hideToolbar, externalSearch]);

  const filteredIncomes = useMemo(() => {
    return incomeCategories.filter(cat => {
      if (hiddenIds.has(cat._id)) return false;
      const search = hideToolbar ? externalSearch : searchQuery;
      return cat.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [incomeCategories, searchQuery, hiddenIds, hideToolbar, externalSearch]);
  const renderCategoryItem = (cat: any, index: number) => (
    <List.Item className="!p-0 !border-0 mb-2">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm w-full relative overflow-hidden group">
        <div className="flex items-center gap-3 z-10">
          <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 text-right">{index + 1}.</span>
          <CategoryIcon name={cat.icon} color={cat.color} className="w-5 h-5" />
          <span className="font-medium text-foreground">{cat.name}</span>
        </div>
        <div className="flex items-center gap-1.5 z-10">
          {!cat.isSystem && (
            <>
              <CategoryForm category={cat} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors"
                onClick={() => {
                  triggerDelete({
                    id: cat._id,
                    entityName: cat.name,
                    onCommit: async () => {
                      const res = await deleteCategory(cat._id);
                      if (res && !res.success) {
                        throw new Error(res.error);
                      }
                    }
                  });
                }}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        {/* Decorative background circle */}
        <div 
          className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-5 pointer-events-none"
          style={{ backgroundColor: cat.color || "var(--primary)" }}
        />
      </div>
    </List.Item>
  );

  if (hideToolbar) {
    const dataSource = externalType === "income" ? filteredIncomes : filteredExpenses;
    return (
      <div className="w-full">
        {dataSource.length === 0 ? (
          <div className="p-8 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">No {externalType} categories match.</p>
          </div>
        ) : (
            <List
              dataSource={dataSource}
              pagination={{ pageSize: 12, size: "small", position: "bottom", align: "end" }}
              renderItem={renderCategoryItem}
              grid={{ gutter: 16, xs: 2, sm: 2, md: 2, lg: 2, xl: 3, xxl: 3 }}
            />
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {(expenseCategories.length > 0 || incomeCategories.length > 0) && (
        <div className="flex bg-card p-3 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="w-full">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "expense",
              label: `Expense Categories (${expenseCategories.length})`,
              children: (
                <div className="pt-2">
                  {filteredExpenses.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed">
                      <p className="text-muted-foreground">No expense categories match.</p>
                    </div>
                  ) : (
                    <List
                      dataSource={filteredExpenses}
                      pagination={{ pageSize: 12, size: "small", position: "bottom", align: "end" }}
                      renderItem={renderCategoryItem}
                      grid={{ gutter: 16, xs: 2, sm: 2, md: 2, lg: 2, xl: 3, xxl: 3 }}
                    />
                  )}
                </div>
              ),
            },
            {
              key: "income",
              label: `Income Categories (${incomeCategories.length})`,
              children: (
                <div className="pt-2">
                  {filteredIncomes.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed">
                      <p className="text-muted-foreground">No income categories match.</p>
                    </div>
                  ) : (
                    <List
                      dataSource={filteredIncomes}
                      pagination={{ pageSize: 12, size: "small", position: "bottom", align: "end" }}
                      renderItem={renderCategoryItem}
                      grid={{ gutter: 16, xs: 2, sm: 2, md: 2, lg: 2, xl: 3, xxl: 3 }}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
