import { getLoans } from "@/actions/loan";
import { getAccounts } from "@/actions/account";
import { LoanClient } from "./LoanClient";
import { LoanForm } from "@/components/forms/LoanForm";

export default async function LoansPage() {
  const loans = await getLoans();
  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Loans & EMIs</h1>
          <p className="text-muted-foreground mt-1">Track your debts, active EMIs, and money lent to others.</p>
        </div>
        <LoanForm accounts={accounts} triggerClassName="w-full sm:w-auto" />
      </div>

      <LoanClient loans={loans} accounts={accounts} />
    </div>
  );
}
