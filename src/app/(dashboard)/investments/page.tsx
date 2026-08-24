import React from "react";
import { getInvestments } from "@/actions/investment";
import { getAccounts } from "@/actions/account";
import { InvestmentClient } from "./InvestmentClient";

export const metadata = {
  title: "Investments | Money Manager",
  description: "Track your wealth growth across all asset classes.",
};

export default async function InvestmentsPage() {
  const [investments, accounts] = await Promise.all([
    getInvestments(),
    getAccounts()
  ]);

  return <InvestmentClient initialInvestments={investments} accounts={accounts} />;
}
