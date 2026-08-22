import { getPeople } from "@/actions/person";
import { PersonForm } from "@/components/forms/PersonForm";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { PersonList } from "@/components/lists/PersonList";

export default async function PeoplePage() {
  const people = await getPeople();

  const totalOweUs = people.filter((p: any) => p.netBalance > 0).reduce((acc: number, p: any) => acc + p.netBalance, 0);
  const totalWeOwe = people.filter((p: any) => p.netBalance < 0).reduce((acc: number, p: any) => acc + Math.abs(p.netBalance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People Ledger</h1>
          <p className="text-muted-foreground">Manage money you lent or borrowed.</p>
        </div>
        <PersonForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Money to Receive</h3>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-emerald-500"><CurrencyDisplay amount={totalOweUs} showSign /></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Money to Pay</h3>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-red-500"><CurrencyDisplay amount={-totalWeOwe} showSign /></div>
          </div>
        </div>
      </div>

      <PersonList people={people} />
    </div>
  );
}
