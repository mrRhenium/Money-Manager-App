import { getLoans } from "@/actions/loan";
import { getAccounts } from "@/actions/account";
import { LoanClient } from "./LoanClient";

export default async function LoansPage() {
  const loans = await getLoans();
  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Loans & EMIs</h1>
        <p className="text-muted-foreground mt-1">Track your debts, active EMIs, and money lent to others.</p>
      </div>

      <LoanClient loans={loans} accounts={accounts} />
    </div>
  );
}
