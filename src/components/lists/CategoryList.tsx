"use client";

import { List } from "antd";

export function CategoryList({ expenseCategories, incomeCategories }: { expenseCategories: any[], incomeCategories: any[] }) {
  const renderCategoryItem = (cat: any) => (
    <List.Item className="!p-0 !border-0 mb-2">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm w-full">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="font-medium">{cat.name}</span>
        </div>
      </div>
    </List.Item>
  );

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Expenses</h2>
        <div className="space-y-2">
          {expenseCategories.length === 0 ? (
             <p className="text-sm text-muted-foreground">No expense categories.</p>
          ) : (
            <List
              dataSource={expenseCategories}
              pagination={{ pageSize: 10, size: "small", position: "bottom", align: "end" }}
              renderItem={renderCategoryItem}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Income</h2>
        <div className="space-y-2">
          {incomeCategories.length === 0 ? (
             <p className="text-sm text-muted-foreground">No income categories.</p>
          ) : (
            <List
              dataSource={incomeCategories}
              pagination={{ pageSize: 10, size: "small", position: "bottom", align: "end" }}
              renderItem={renderCategoryItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
