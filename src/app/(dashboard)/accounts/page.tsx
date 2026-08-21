import { getAccounts } from "@/actions/account";
import { AccountForm } from "@/components/forms/AccountForm";
import { AccountList } from "@/components/lists/AccountList";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your wallets, bank accounts, and credit cards.</p>
        </div>
        <AccountForm />
      </div>

      <AccountList accounts={accounts} />
    </div>
  );
}
