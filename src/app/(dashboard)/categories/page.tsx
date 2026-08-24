import React from "react";
import { getCategories } from "@/actions/category";
import { CategoryClient } from "./CategoryClient";

export default async function CategoriesPage() {
  const categories = await getCategories();
  
  const expenseCategories = categories.filter((c: any) => c.type === "expense");
  const incomeCategories = categories.filter((c: any) => c.type === "income");

  return (
    <CategoryClient 
      expenseCategories={expenseCategories} 
      incomeCategories={incomeCategories} 
    />
  );
}
