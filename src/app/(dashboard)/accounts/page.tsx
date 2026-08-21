import { getAccounts } from "@/actions/account";
import { AccountForm } from "@/components/forms/AccountForm";
import { Button } from "@/components/ui/button";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your wallets, bank accounts, and credit cards.</p>
        </div>
        <AccountForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground mb-4">No accounts found.</p>
            <Button variant="outline">Create your first account</Button>
          </div>
        ) : (
          accounts.map((account: any) => (
            <div key={account._id} className="rounded-xl border bg-card text-card-foreground shadow p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium capitalize">{account.name}</h3>
                <span className="text-xs text-muted-foreground uppercase bg-secondary px-2 py-1 rounded-md">{account.type}</span>
              </div>
              <div className="pt-2">
                <div className="text-2xl font-bold">₹{account.balance.toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
