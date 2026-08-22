import React from "react";
import { getInvestments } from "@/actions/investment";
import { getAccounts } from "@/actions/account";
import { InvestmentForm } from "@/components/forms/InvestmentForm";
import { InvestmentTable } from "@/components/tables/InvestmentTable";
import { TrendingUp, PieChart, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default async function InvestmentsPage() {
  const [investments, accounts] = await Promise.all([
    getInvestments(),
    getAccounts()
  ]);

  const totalInvested = investments.reduce((sum: number, inv: any) => sum + (inv.investedAmount || 0), 0);
  const currentTotal = investments.reduce((sum: number, inv: any) => sum + (inv.currentValue || 0), 0);
  const totalReturns = currentTotal - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const latestSync = investments
    .map((i: any) => i.lastAutoUpdatedAt ? new Date(i.lastAutoUpdatedAt).getTime() : 0)
    .sort((a: number, b: number) => b - a)[0];

  // Group by category
  const categories: Record<string, { invested: number, current: number }> = {};
  investments.forEach((inv: any) => {
    const type = inv.investmentType || "Other";
    if (!categories[type]) categories[type] = { invested: 0, current: 0 };
    categories[type].invested += (inv.investedAmount || 0);
    categories[type].current += (inv.currentValue || 0);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">Track your wealth growth across all asset classes.</p>
        </div>
        <div className="flex items-center gap-4">
          {latestSync > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border">
              <RefreshCw className="w-3 h-3" />
              Synced {dayjs(latestSync).fromNow()}
            </div>
          )}
          <InvestmentForm accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvested.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentTotal.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Returns</CardTitle>
            <TrendingUp className={`w-4 h-4 ${totalReturns >= 0 ? "text-emerald-500" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalReturns >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {totalReturns >= 0 ? "+" : ""}₹{totalReturns.toLocaleString("en-IN")}
              <span className="text-sm font-medium ml-2 opacity-80">
              ({totalReturns >= 0 ? "+" : ""}{returnsPercentage.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(categories).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(categories).map(([type, data]) => {
            const ret = data.current - data.invested;
            const pct = data.invested > 0 ? (ret / data.invested) * 100 : 0;
            const isPos = ret >= 0;
            return (
              <Card key={type} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{type}</div>
                  <div className="text-sm font-bold">₹{data.current.toLocaleString("en-IN")}</div>
                  <div className={`text-xs mt-1 ${isPos ? "text-emerald-500" : "text-destructive"}`}>
                    {isPos ? "+" : ""}₹{ret.toLocaleString("en-IN")} ({isPos ? "+" : ""}{pct.toFixed(1)}%)
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border p-4 md:p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          My Portfolio
        </h2>
        {investments.length > 0 ? (
          <InvestmentTable investments={investments} accounts={accounts} />
        ) : (
          <div className="text-center p-12 border rounded-xl border-dashed">
            <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No investments yet</h3>
            <p className="text-muted-foreground">Start tracking your SIPs, Mutual Funds, and Stocks using the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
