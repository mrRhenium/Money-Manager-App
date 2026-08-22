import React from "react";
import { getInsurancePolicies } from "@/actions/insurance";
import { getAccounts } from "@/actions/account";
import { InsuranceForm } from "@/components/forms/InsuranceForm";
import { InsuranceTable } from "@/components/tables/InsuranceTable";
import { Shield, ShieldAlert, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

export default async function InsurancePage() {
  const [policies, accounts] = await Promise.all([
    getInsurancePolicies(),
    getAccounts()
  ]);

  const activePolicies = policies.filter((p: any) => p.status === 'active');
  const totalCoverage = activePolicies.reduce((sum: number, p: any) => sum + (p.coverageAmount || 0), 0);
  const totalPremium = activePolicies.reduce((sum: number, p: any) => sum + (p.premiumAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance</h1>
          <p className="text-muted-foreground">Manage your life, health, and general insurance policies.</p>
        </div>
        <InsuranceForm accounts={accounts} triggerClassName="w-full sm:w-auto" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Policies</CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePolicies.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Coverage (Sum Assured)</CardTitle>
            <Activity className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={totalCoverage} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Premium</CardTitle>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={totalPremium} /></div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border p-4 md:p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          My Policies
        </h2>
        {policies.length > 0 ? (
          <InsuranceTable policies={policies} accounts={accounts} />
        ) : (
          <div className="text-center p-12 border rounded-xl border-dashed">
            <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No insurance policies found</h3>
            <p className="text-muted-foreground">Add your term life, health insurance, and motor insurance details using the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
