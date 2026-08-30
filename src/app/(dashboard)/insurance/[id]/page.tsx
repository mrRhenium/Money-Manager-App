import React from "react";
import { getInsurancePolicyById } from "@/actions/insurance";
import { getAccounts } from "@/actions/account";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateString } from "@/lib/dateTimeHelper";
import { ArrowLeft, Shield, Calendar, Hash, Activity } from "lucide-react";
import Link from "next/link";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { KPICard } from "@/components/dashboard/KPICard";

import { MasterHeader } from "@/components/layout/MasterHeader";

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
      <MasterHeader
        backHref="/insurance"
        title={policy.policyName}
        subtitle={
          <span className="flex items-center gap-2">
            <span className="capitalize">{policy.provider}</span>
            <span>•</span>
            <span className={policy.status === 'active' ? 'text-emerald-500 font-medium' : 'text-amber-500 capitalize font-medium'}>{policy.status}</span>
          </span>
        }
      />

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <KPICard 
              label="Coverage (Sum Assured)" 
              value={<CurrencyDisplay amount={policy.coverageAmount || 0} />} 
              icon={Shield} 
              themeColor="indigo" 
            />
            <KPICard 
              label="Premium" 
              value={<CurrencyDisplay amount={policy.premiumAmount || 0} />} 
              icon={Activity} 
              themeColor="primary" 
              trend={<span className="text-xs text-muted-foreground capitalize">{policy.premiumFrequency}</span>}
            />
            <KPICard 
              label="Next Renewal" 
              value={policy.renewalDate ? formatDateString(policy.renewalDate, "DD-MM-YYYY") : "-"} 
              icon={Calendar} 
              themeColor="emerald" 
            />
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
