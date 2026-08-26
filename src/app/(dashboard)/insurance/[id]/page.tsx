import React from "react";
import { getInsurancePolicyById } from "@/actions/insurance";
import { getAccounts } from "@/actions/account";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateString } from "@/lib/dateTimeHelper";
import { ArrowLeft, Shield, Calendar, Hash, Activity } from "lucide-react";
import Link from "next/link";
import { InsuranceForm } from "@/components/forms/InsuranceForm";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

export default async function InsuranceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, accounts] = await Promise.all([
    getInsurancePolicyById(id),
    getAccounts()
  ]);

  if (!data) return notFound();

  const { policy, payments, claims } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* HEADER SECTION */}
      <div className="shrink-0 h-20 z-40 dark:text-white bg-card/80 backdrop-blur-md shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] border-b py-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full">
          <div className="flex items-center gap-4">
            <Link href="/insurance">
              <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-10 w-10 shrink-0">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {policy.policyName}
              </h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                <span className="capitalize">{policy.provider}</span>
                <span>•</span>
                <span className={policy.status === 'active' ? 'text-emerald-500 font-medium' : 'text-amber-500 capitalize font-medium'}>{policy.status}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <InsuranceForm policy={policy} accounts={accounts} triggerClassName="shadow-sm" />
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Coverage (Sum Assured)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><CurrencyDisplay amount={policy.coverageAmount || 0} /></div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary"><CurrencyDisplay amount={policy.premiumAmount || 0} /></div>
                <p className="text-xs text-muted-foreground">{policy.premiumFrequency}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Next Renewal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {policy.renewalDate ? formatDateString(policy.renewalDate, "DD-MM-YYYY") : "-"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Premium Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments && payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((h: any) => (
                        <div key={h._id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <div className="font-medium"><CurrencyDisplay amount={h.amount || 0} /></div>
                            <div className="text-xs text-muted-foreground">{formatDateString(h.date || h.dueDate || h.createdAt, "DD-MM-YYYY")}</div>
                          </div>
                          <div className="text-sm capitalize">{h.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground border-dashed border rounded-xl">
                      No payment history found.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Policy Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4" /> Type</span>
                    <span className="font-medium">{policy.type}</span>
                  </div>
                  {policy.policyNumber && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4" /> Policy Number</span>
                      <span className="font-medium">{policy.policyNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</span>
                    <span className="font-medium">{formatDateString(policy.startDate, "DD-MM-YYYY")}</span>
                  </div>
                  {policy.endDate && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date</span>
                      <span className="font-medium">{formatDateString(policy.endDate, "DD-MM-YYYY")}</span>
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
