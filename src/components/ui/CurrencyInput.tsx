import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAllCurrencies } from "@/actions/currency";

export const FALLBACK_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  wrapperClassName?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currency, onCurrencyChange, wrapperClassName, ...props }, ref) => {
    const [currencies, setCurrencies] = useState<any[]>([]);

    useEffect(() => {
      async function fetchCurrencies() {
        try {
          const data = await getAllCurrencies(true);
          setCurrencies(data);
        } catch (error) {
          setCurrencies(FALLBACK_CURRENCIES);
        }
      }
      fetchCurrencies();
    }, []);

    const displayCurrencies = currencies.length > 0 ? currencies : FALLBACK_CURRENCIES;

    return (
      <div className={cn("flex items-center gap-2 w-full", wrapperClassName)}>
        <Select value={currency} onValueChange={(val) => { if (val) onCurrencyChange(val); }}>
          <SelectTrigger className="w-[110px] shrink-0 font-medium bg-background">
            <SelectValue placeholder="Cur" />
          </SelectTrigger>
          <SelectContent>
            {displayCurrencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} ({c.code}) - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          className={cn("flex-1", className)}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
