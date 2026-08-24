import React from "react";
import { getRecurringBills } from "@/actions/recurringBill";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { SubscriptionClient } from "./SubscriptionClient";

export const metadata = {
  title: "Subscriptions & Auto-Pay | Money Manager",
  description: "Manage your recurring bills, subscriptions, and allowances.",
};

export default async function SubscriptionsPage() {
  const [bills, accounts, categories] = await Promise.all([
    getRecurringBills(),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <SubscriptionClient 
      initialBills={bills} 
      accounts={accounts} 
      categories={categories} 
    />
  );
}
