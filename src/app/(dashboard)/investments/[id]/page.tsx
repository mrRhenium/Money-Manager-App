import React from "react";
import { getInvestmentById } from "@/actions/investment";
import { getAccounts } from "@/actions/account";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, Hash, Shield, Activity, Trash } from "lucide-react";
import Link from "next/link";
import { InvestmentForm } from "@/components/forms/InvestmentForm";
import { InvestmentHistoryChart } from "@/components/dashboard/InvestmentHistoryChart";
import { InvestmentUpdateForm } from "@/components/forms/InvestmentUpdateForm";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/currencyFormatter";

export default async function InvestmentDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userCurrency = (session.user as any).currency || "INR";

  const [data, accounts] = await Promise.all([
    getInvestmentById(params.id),
    getAccounts()
  ]);

  if (!data) return notFound();

  const { investment, history } = data;
  
  const ret = investment.currentValue - investment.investedAmount;
  const retPct = investment.investedAmount > 0 ? (ret / investment.investedAmount) * 100 : 0;
  const isPos = ret >= 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-center gap-4">
        <Link href="/investments">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{investment.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="capitalize">{investment.investmentType}</span>
            <span>•</span>
            <span className={investment.status === 'active' ? 'text-emerald-500' : 'text-amber-500 capitalize'}>{investment.status}</span>
          </p>
        </div>
        <div className="ml-auto">
          <InvestmentForm investment={investment} accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-muted-foreground mb-1 font-medium">Invested</p>
            <p className="text-3xl font-bold">{formatCurrency(investment.investedAmount, userCurrency)}</p>
          </CardHeader>
        </Card>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <p className="text-muted-foreground mb-1 font-medium">Current Value</p>
            <p className="text-3xl font-bold">{formatCurrency(investment.currentValue, userCurrency)}</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Absolute Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`mt-2 ${isPos ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'} px-4 py-2 rounded-xl inline-flex items-center gap-2`}>
              <span className="font-bold text-xl">{isPos ? "+" : ""}{formatCurrency(ret, userCurrency)}</span>
              <span className="font-semibold opacity-90">({isPos ? "+" : ""}{retPct.toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Manual Update</p>
            <InvestmentUpdateForm investment={{ id: investment._id }} />
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                Value History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvestmentHistoryChart history={history} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</span>
                <span className="font-medium">{new Date(investment.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Frequency</span>
                <span className="font-medium">{investment.frequency}</span>
              </div>
              {investment.folioNumber && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4" /> Folio/Acc No</span>
                  <span className="font-medium">{investment.folioNumber}</span>
                </div>
              )}
              {investment.platform && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4" /> Platform</span>
                  <span className="font-medium">{investment.platform}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
