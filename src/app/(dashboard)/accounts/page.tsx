import { getAccounts } from "@/actions/account";
import { AccountClient } from "./AccountClient";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <AccountClient initialAccounts={accounts} />
  );
}
