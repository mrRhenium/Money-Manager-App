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

export default async function CreditCardDetailPage({ params }: { params: { id: string } }) {
  const data = await getCreditCardById(params.id);
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
              {card.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {card.transactions.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t.note || t.categoryId?.name || "Expense"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(t.date).toLocaleDateString()} • {t.categoryId?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground">
                          -₹{t.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Billing Statements</CardTitle>
            </CardHeader>
            <CardContent>
              {card.statements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No statements generated yet.</p>
              ) : (
                <div className="space-y-4">
                  {card.statements.map((s: any) => (
                    <div key={s._id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Statement: {s.statementMonth}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {new Date(s.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">₹{s.totalAmount.toLocaleString("en-IN")}</span>
                        <div className="mt-1">
                          {s.paymentStatus === "paid" ? (
                            <span className="text-xs bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded-full">Paid</span>
                          ) : s.paymentStatus === "partially_paid" ? (
                            <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">Partial (₹{s.amountPaid})</span>
                          ) : s.paymentStatus === "overdue" ? (
                             <span className="text-xs bg-red-500/20 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>
                          ) : (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Unpaid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
