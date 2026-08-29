import { getCreditCardById } from "@/actions/creditCard";
import { getAccounts } from "@/actions/account";
import { CreditCard as CardIcon, ArrowLeft, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// A mock PayBillModal component for simplicity. In a real app, this would be a client component form.
import { PayBillModal } from "./PayBillModal";
import { formatDate } from "@/lib/helpers";
import { auth } from "@/lib/auth";
import { CreditCardTransactionTable } from "@/components/tables/CreditCardTransactionTable";
import { CreditCardStatementTable } from "@/components/tables/CreditCardStatementTable";
import { formatIndianNumber } from "@/lib/numberHelper";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { CreditCardForm } from "@/components/forms/CreditCardForm";

export default async function CreditCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userTimezone = (session?.user as any)?.timezone || "UTC";

  const data = await getCreditCardById(id);
  const accounts = await getAccounts();
  const bankAccounts = accounts.filter((a: any) => a.type === "bank" || a.type === "cash" || a.type === "wallet");

  const card = data;
  const utilization = (card.currentOutstanding / card.creditLimit) * 100;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* HEADER SECTION */}
      <div className="shrink-0 h-20 z-40 dark:text-white bg-card/80 backdrop-blur-md shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] border-b py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/credit-cards">
              <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-10 w-10 shrink-0">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {card.bankName} {card.cardName}
              </h1>
              <p className="text-muted-foreground text-sm font-mono tracking-widest mt-1">•••• {card.last4Digits}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCardForm card={card} />
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Card */}
            <div
              className="rounded-2xl p-6 text-white shadow-lg overflow-hidden h-56 flex flex-col justify-between col-span-1"
              style={{ background: `linear-gradient(135deg, ${card.color} 0%, #1a1a1a 150%)` }}
            >
              <div className="flex justify-between items-start">
                <CardIcon className="w-8 h-8 opacity-80" />
                <div className="bg-white/20 px-2 py-1 rounded text-xs font-semibold uppercase backdrop-blur-md">
                  {card.cardNetwork}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end text-sm">
                  <div>
                    <p className="opacity-70 text-xs">Outstanding</p>
                    <p className="text-2xl font-bold"><CurrencyDisplay amount={card.currentOutstanding} /></p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-70 text-xs">Available</p>
                    <p className="font-bold"><CurrencyDisplay amount={card.availableLimit} /></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="shadow-sm border-none bg-card">
                <CardContent className="p-4 pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
                  <p className="text-xl font-bold"><CurrencyDisplay amount={card.creditLimit} /></p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-none bg-card">
                <CardContent className="p-4 pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Cycle</p>
                  <p className="text-lg font-bold">{card.billingCycleStartDay} to {card.billingCycleEndDay}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-none bg-card">
                <CardContent className="p-4 pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Due Day</p>
                  <p className="text-lg font-bold">{card.paymentDueDay}th</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-none bg-card flex items-center justify-center">
                <CardContent className="p-4 w-full">
                  <PayBillModal
                    cardId={card._id}
                    outstanding={card.currentOutstanding}
                    accounts={bankAccounts}
                    statements={card.statements.filter((s: any) => s.paymentStatus !== "paid")}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="w-full space-y-3 mt-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Used / Limit</p>
                <p className="text-sm font-semibold"><CurrencyDisplay amount={card.currentOutstanding} /> <span className="text-muted-foreground font-normal">/ <CurrencyDisplay amount={card.creditLimit} /></span></p>
              </div>
              <div className="text-right">
                <span className={utilization > 70 ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{utilization.toFixed(1)}%</span>
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mt-1 flex gap-1 justify-end">
                  LEFT: <CurrencyDisplay amount={card.availableLimit} />
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(utilization, 100)}
              className="h-3"
              indicatorColor={utilization > 70 ? "#ef4444" : "#10b981"}
            />
          </div>

          <Tabs defaultValue="transactions" className="w-full mt-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="statements">Statements</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Card Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreditCardTransactionTable transactions={card.transactions} userTimezone={userTimezone} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statements" className="mt-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Billing Statements</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreditCardStatementTable statements={card.statements} userTimezone={userTimezone} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
