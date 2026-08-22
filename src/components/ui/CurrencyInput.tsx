import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const CURRENCIES = [
  { value: "INR", label: "₹ (INR)", symbol: "₹" },
  { value: "USD", label: "$ (USD)", symbol: "$" },
  { value: "EUR", label: "€ (EUR)", symbol: "€" },
  { value: "GBP", label: "£ (GBP)", symbol: "£" },
  { value: "AED", label: "د.إ (AED)", symbol: "د.إ" },
];

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  wrapperClassName?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, currency, onCurrencyChange, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("flex items-center gap-2 w-full", wrapperClassName)}>
        <Select value={currency} onValueChange={(val) => { if (val) onCurrencyChange(val); }}>
          <SelectTrigger className="w-[100px] shrink-0 font-medium">
            <SelectValue placeholder="Cur" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
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
