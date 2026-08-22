"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useEffect, useState } from "react";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";

export function useCurrency() {
  const { data: session } = useSession();
  const currencyCode = (session?.user as any)?.currency || "INR";
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (currencyCode !== "INR") {
      fetchExchangeRates().then(setRates);
    }
  }, [currencyCode]);
  
  return {
    currencyCode,
    format: (amount: number) => {
      const rate = getConversionRate(currencyCode, rates);
      return formatCurrency(amount * rate, currencyCode);
    }
  };
}

