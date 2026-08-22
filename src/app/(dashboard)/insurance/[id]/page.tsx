import React from "react";
import { getInsurancePolicyById } from "@/actions/insurance";
import { getAccounts } from "@/actions/account";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Calendar, Hash, Activity } from "lucide-react";
import Link from "next/link";
import { InsuranceForm } from "@/components/forms/InsuranceForm";

export default async function InsuranceDetailsPage({ params }: { params: { id: string } }) {
  const [data, accounts] = await Promise.all([
    getInsurancePolicyById(params.id),
    getAccounts()
  ]);

  if (!data) return notFound();

  const { policy, payments, claims } = data;
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-center gap-4">
        <Link href="/insurance">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{policy.policyName}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="capitalize">{policy.provider}</span>
            <span>•</span>
            <span className={policy.status === 'active' ? 'text-emerald-500' : 'text-amber-500 capitalize'}>{policy.status}</span>
          </p>
        </div>
        <div className="ml-auto">
          <InsuranceForm policy={policy} accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Coverage (Sum Assured)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{policy.coverageAmount.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{policy.premiumAmount.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">{policy.premiumFrequency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Next Renewal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policy.renewalDate ? new Date(policy.renewalDate).toLocaleDateString() : "-"}
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
                        <div className="font-medium">₹{h.amount.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-muted-foreground">{new Date(h.date || h.dueDate || h.createdAt).toLocaleDateString()}</div>
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
                <span className="font-medium">{new Date(policy.startDate).toLocaleDateString()}</span>
              </div>
              {policy.endDate && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date</span>
                  <span className="font-medium">{new Date(policy.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
