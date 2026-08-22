"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/currencyFormatter";

export function useCurrency() {
  const { data: session } = useSession();
  const currencyCode = (session?.user as any)?.currency || "INR";
  
  return {
    currencyCode,
    format: (amount: number) => formatCurrency(amount, currencyCode)
  };
}
