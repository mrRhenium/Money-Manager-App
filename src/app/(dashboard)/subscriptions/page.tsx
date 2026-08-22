import { getRecurringBills } from "@/actions/recurringBill";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { RecurringBillList } from "@/components/lists/RecurringBillList";
import { RecurringBillForm } from "@/components/forms/RecurringBillForm";
import { Repeat } from "lucide-react";

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Repeat className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            Subscriptions
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track auto-pays, OTT subscriptions, and monthly allowances.
          </p>
        </div>
        <RecurringBillForm accounts={accounts} categories={categories} triggerClassName="w-full sm:w-auto" />
      </div>

      <RecurringBillList bills={bills} accounts={accounts} categories={categories} />
    </div>
  );
}
