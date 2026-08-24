import { getGoals } from "@/actions/goal";
import { getAccounts } from "@/actions/account";
import { GoalClient } from "./GoalClient";

export default async function GoalsPage() {
  const goals = await getGoals();
  const accounts = await getAccounts();

  return <GoalClient initialGoals={goals} accounts={accounts} />;
}
