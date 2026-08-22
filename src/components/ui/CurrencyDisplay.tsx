"use client";

import { useCurrency } from "@/hooks/useCurrency";
import React from "react";

interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  showSign?: boolean;
}

export function CurrencyDisplay({ amount, showSign = false, className, ...props }: CurrencyDisplayProps) {
  const { format } = useCurrency();
  
  const formatted = format(Math.abs(amount));
  let prefix = "";
  
  if (amount < 0) prefix = "-";
  else if (amount > 0 && showSign) prefix = "+";

  return (
    <span className={className} {...props}>
      {prefix}{formatted}
    </span>
  );
}
