"use client";

import { List, Popconfirm, Modal, Tabs } from "antd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryForm } from "../forms/CategoryForm";
import { deleteCategory } from "@/actions/category";
import { Trash, Search } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useState, useMemo } from "react";

export function CategoryList({ expenseCategories, incomeCategories }: { expenseCategories: any[], incomeCategories: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("expense");

  const filteredExpenses = useMemo(() => {
    return expenseCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [expenseCategories, searchQuery]);

  const filteredIncomes = useMemo(() => {
    return incomeCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [incomeCategories, searchQuery]);
  const renderCategoryItem = (cat: any) => (
    <List.Item className="!p-0 !border-0 mb-2">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm w-full">
        <div className="flex items-center gap-3">
          <CategoryIcon name={cat.icon} color={cat.color} className="w-5 h-5" />
          <span className="font-medium">{cat.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!cat.isSystem && (
            <>
              <CategoryForm category={cat} />
              <Popconfirm
                title="Delete Category"
                description="Are you sure you want to delete this category?"
                onConfirm={async () => {
                  try {
                    const res = await deleteCategory(cat._id);
                    if (res && !res.success) {
                      Modal.error({
                        title: "Cannot Delete Category",
                        content: res.error || "This category is in use elsewhere.",
                        okText: "Close",
                      });
                    }
                  } catch (err: any) {
                    Modal.error({
                      title: "Cannot Delete Category",
                      content: err.message || "This category is in use elsewhere.",
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
            </>
          )}
        </div>
      </div>
    </List.Item>
  );

  return (
    <div className="w-full space-y-4">
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

      <div className="bg-card rounded-xl border shadow-sm p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "expense",
              label: "Expense Categories",
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
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                    />
                  )}
                </div>
              ),
            },
            {
              key: "income",
              label: "Income Categories",
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
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
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
