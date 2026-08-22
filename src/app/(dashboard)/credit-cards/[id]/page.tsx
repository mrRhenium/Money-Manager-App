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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/credit-cards" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {card.bankName} {card.cardName}
          </h1>
          <p className="text-muted-foreground text-sm font-mono tracking-widest">•••• {card.last4Digits}</p>
        </div>
      </div>

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
                <p className="text-2xl font-bold">₹{card.currentOutstanding.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="opacity-70 text-xs">Available</p>
                <p className="font-bold">₹{card.availableLimit.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-sm border-none bg-card">
            <CardContent className="p-4 pt-6">
              <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
              <p className="text-xl font-bold">₹{card.creditLimit.toLocaleString("en-IN")}</p>
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
                 statements={card.statements.filter((s:any) => s.paymentStatus !== "paid")}
               />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Utilization: {utilization.toFixed(1)}%</span>
          <span>{card.currentOutstanding > 0 ? "Use with caution" : "All clear"}</span>
        </div>
        <Progress value={utilization} className={`h-3 ${utilization > 70 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
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
  );
}
