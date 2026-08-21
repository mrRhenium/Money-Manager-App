import { getInvestments } from "@/actions/investment";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvestmentTable } from "@/components/tables/InvestmentTable";

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

      <InvestmentTable investments={investments} />
    </div>
  );
}
