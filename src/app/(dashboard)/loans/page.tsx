import { getLoans } from "@/actions/loan";
import { getAccounts } from "@/actions/account";
import { LoanClient } from "./LoanClient";

export const metadata = {
  title: "Loans & EMIs | Money Manager",
  description: "Track your debts, active EMIs, and money lent to others.",
};

export default async function LoansPage() {
  const loans = await getLoans();
  const accounts = await getAccounts();

  return (
    <LoanClient initialLoans={loans} accounts={accounts} />
  );
}
