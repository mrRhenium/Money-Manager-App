import React from "react";
import { getInvestmentById } from "@/actions/investment";
import { getAccounts } from "@/actions/account";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, Hash, Shield, Activity, Trash, Wallet, PieChartIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { InvestmentHistoryChart } from "@/components/dashboard/InvestmentHistoryChart";
import { InvestmentUpdateForm } from "@/components/forms/InvestmentUpdateForm";
import { auth } from "@/lib/auth";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { formatDateString } from "@/lib/dateTimeHelper";
import { KPICard } from "@/components/dashboard/KPICard";

export default async function InvestmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userCurrency = (session.user as any).currency || "INR";

  const { id } = await params;
  const [data, accounts] = await Promise.all([
    getInvestmentById(id),
    getAccounts()
  ]);

  if (!data) return notFound();

  const { investment, history } = data;

  const ret = investment.currentValue - investment.investedAmount;
  const retPct = investment.investedAmount > 0 ? (ret / investment.investedAmount) * 100 : 0;
  const isPos = ret >= 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">

      {/* HEADER SECTION */}
      <div className="shrink-0 h-20 z-40 dark:text-white bg-card/80 backdrop-blur-md shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] border-b py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/investments">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{investment.name}</h1>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                <span>{investment.investmentType}</span>
                <span>•</span>
                <span className={investment.status === 'active' ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>{investment.status}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-2 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top KPI Cards */}
          <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <KPICard 
              label="Invested" 
              value={<CurrencyDisplay amount={investment.investedAmount} />} 
              icon={Wallet} 
              themeColor="primary" 
            />
            <KPICard 
              label="Current Value" 
              value={<CurrencyDisplay amount={investment.currentValue} />} 
              icon={PieChartIcon} 
              themeColor="indigo" 
            />
            <KPICard 
              label="Absolute Returns" 
              value={
                <div className={isPos ? "text-emerald-500" : "text-destructive"}>
                  <CurrencyDisplay amount={ret} showSign />
                </div>
              } 
              icon={TrendingUp} 
              themeColor={isPos ? "emerald" : "destructive"} 
              trend={
                <span className={`text-sm font-medium opacity-80 inline-block ${isPos ? "text-emerald-500" : "text-destructive"}`}>
                  ({isPos ? "+" : ""}{retPct.toFixed(2)}%)
                </span>
              }
            />
            <KPICard 
              label="Manual Update" 
              value={
                <div className="mt-1">
                  <InvestmentUpdateForm investment={{ id: investment._id }} />
                </div>
              } 
              icon={RefreshCw} 
              themeColor="amber" 
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl">
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
              <Card className="shadow-sm border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</span>
                    <span className="font-medium">{formatDateString(investment.startDate, "DD-MM-YYYY")}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Frequency</span>
                    <span className="font-medium">{investment.frequency}</span>
                  </div>
                  {investment.units != null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4" /> Units Held</span>
                      <span className="font-medium">{investment.units}</span>
                    </div>
                  )}
                  {investment.currentPrice != null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Latest {investment.investmentType === "MutualFund" || investment.investmentType === "SIP" ? "NAV" : "Price"}</span>
                      <span className="font-medium"><CurrencyDisplay amount={investment.currentPrice} /></span>
                    </div>
                  )}
                  {investment.folioNumber && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4" /> Folio/Acc No</span>
                      <span className="font-medium">{investment.folioNumber}</span>
                    </div>
                  )}
                  {investment.platform && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4" /> Platform</span>
                      <span className="font-medium">{investment.platform}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
