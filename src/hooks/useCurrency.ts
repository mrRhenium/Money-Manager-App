"use client";

import { useSession } from "next-auth/react";
import { formatCurrency, formatCompactCurrency } from "@/lib/currencyFormatter";
import { useEffect, useState } from "react";
import { fetchExchangeRates, getConversionRate } from "@/lib/currencyRates";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  CAD: "CA$",
  AUD: "AU$",
  JPY: "¥",
};

export function getCurrencySymbol(code: string = "INR"): string {
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];
  try {
    return (
      (0)
        .toLocaleString("en", {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/\d/g, "")
        .trim() || code
    );
  } catch {
    return code;
  }
}

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
    currencySymbol: getCurrencySymbol(currencyCode),
    format: (amount: number) => {
      const rate = getConversionRate(currencyCode, rates);
      return formatCurrency(amount * rate, currencyCode);
    },
    formatCompact: (amount: number) => {
      const rate = getConversionRate(currencyCode, rates);
      return formatCompactCurrency(amount * rate, currencyCode);
    }
  };
}

