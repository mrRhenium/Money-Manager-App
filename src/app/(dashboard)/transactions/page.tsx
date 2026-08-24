import { getTransactions } from "@/actions/transaction";
import { getAccounts } from "@/actions/account";
import { getCategories } from "@/actions/category";
import { getPeople } from "@/actions/person";
import { getCreditCards } from "@/actions/creditCard";
import { ExportButton } from "@/components/transactions/ExportButton";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

import { TransactionClient } from "./TransactionClient";

export const metadata = {
  title: "Transactions | Money Manager",
  description: "Track all your incomes and expenses.",
};

export default async function TransactionsPage() {
  const session = await auth();
  const userTimezone = (session?.user as any)?.timezone || "UTC";

  const [transactions, accounts, categories, people, creditCards] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
    getPeople(),
    getCreditCards()
  ]);

  return (
    <TransactionClient 
      initialTransactions={transactions}
      userTimezone={userTimezone}
      accounts={accounts}
      categories={categories}
      people={people}
      creditCards={creditCards}
    />
  );
}
