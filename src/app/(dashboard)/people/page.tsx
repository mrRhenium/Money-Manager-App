import { getPeople } from "@/actions/person";
import { User as UserIcon } from "lucide-react";
import { PersonForm } from "@/components/forms/PersonForm";
import { Button } from "@/components/ui/button";

export default async function PeoplePage() {
  const people = await getPeople();

  const totalOweUs = people.filter((p: any) => p.netBalance > 0).reduce((acc: number, p: any) => acc + p.netBalance, 0);
  const totalWeOwe = people.filter((p: any) => p.netBalance < 0).reduce((acc: number, p: any) => acc + Math.abs(p.netBalance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <div className="text-2xl font-bold text-emerald-500">+₹{totalOweUs.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Money to Pay</h3>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold text-red-500">-₹{totalWeOwe.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {people.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground mb-4">No people added yet.</p>
            <Button variant="outline">Add your first contact</Button>
          </div>
        ) : (
          people.map((person: any) => (
            <div key={person._id} className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{person.name}</h3>
                    <p className="text-xs text-muted-foreground">{person.relation}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net Balance</span>
                <span className={`font-bold ${person.netBalance > 0 ? "text-emerald-500" : person.netBalance < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {person.netBalance > 0 ? `+₹${person.netBalance.toLocaleString("en-IN")}` : 
                   person.netBalance < 0 ? `-₹${Math.abs(person.netBalance).toLocaleString("en-IN")}` : 
                   "Settled"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
