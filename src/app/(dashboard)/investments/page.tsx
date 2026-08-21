import { getInvestments } from "@/actions/investment";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InvestmentsPage() {
  const investments = await getInvestments();

  const totalInvested = investments.reduce((acc: number, curr: any) => acc + curr.investedAmount, 0);
  const totalCurrentValue = investments.reduce((acc: number, curr: any) => acc + curr.currentValue, 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">Track your portfolio and net worth growth.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Invested</h3>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold">₹{totalInvested.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Current Value</h3>
          </div>
          <div className="pt-2">
            <div className="text-2xl font-bold">₹{totalCurrentValue.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Overall Returns</h3>
            <TrendingUp className={`w-4 h-4 ${totalReturns >= 0 ? "text-emerald-500" : "text-red-500"}`} />
          </div>
          <div className="pt-2 flex items-baseline gap-2">
            <div className={`text-2xl font-bold ${totalReturns >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {totalReturns >= 0 ? "+" : ""}₹{totalReturns.toLocaleString("en-IN")}
            </div>
            <span className={`text-sm font-medium ${totalReturns >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              ({totalReturns >= 0 ? "+" : ""}{returnsPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right">Invested</th>
                  <th className="px-6 py-3 font-medium text-right">Current Value</th>
                  <th className="px-6 py-3 font-medium text-right">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No investments found.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv: any) => {
                    const ret = inv.currentValue - inv.investedAmount;
                    const retPct = inv.investedAmount > 0 ? (ret / inv.investedAmount) * 100 : 0;
                    return (
                      <tr key={inv._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{inv.name}</td>
                        <td className="px-6 py-4">{inv.type}</td>
                        <td className="px-6 py-4 text-right">₹{inv.investedAmount.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-right">₹{inv.currentValue.toLocaleString("en-IN")}</td>
                        <td className={`px-6 py-4 text-right font-medium ${ret >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {ret >= 0 ? "+" : ""}₹{ret.toLocaleString("en-IN")} ({ret >= 0 ? "+" : ""}{retPct.toFixed(2)}%)
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
