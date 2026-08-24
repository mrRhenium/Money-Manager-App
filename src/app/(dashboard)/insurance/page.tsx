import React from "react";
import { getInsurancePolicies } from "@/actions/insurance";
import { getAccounts } from "@/actions/account";
import { InsuranceClient } from "./InsuranceClient";

export const metadata = {
  title: "Insurance | Money Manager",
  description: "Manage your life, health, and general insurance policies.",
};

export default async function InsurancePage() {
  const [policies, accounts] = await Promise.all([
    getInsurancePolicies(),
    getAccounts()
  ]);

  return (
    <InsuranceClient 
      initialPolicies={policies} 
      accounts={accounts} 
    />
  );
}
