"use client";

import { List, Popconfirm, Modal } from "antd";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "../forms/CategoryForm";
import { deleteCategory } from "@/actions/category";
import { Trash } from "lucide-react";

export function CategoryList({ expenseCategories, incomeCategories }: { expenseCategories: any[], incomeCategories: any[] }) {
  const renderCategoryItem = (cat: any) => (
    <List.Item className="!p-0 !border-0 mb-2">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm w-full">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
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
