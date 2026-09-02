"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateInvestmentValue } from "@/actions/investment";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

export function InvestmentUpdateForm({ investment, onUpdate }: { investment: any, onUpdate?: () => void }) {
  const { currencyCode } = useCurrency();
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!val) return;
    const num = parseIndianNumber(val);
    if (isNaN(num)) return;

    setLoading(true);
    try {
      await updateInvestmentValue(investment.id, num);
      toast.success("Value updated successfully");
      setVal("");
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update value");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input 
        type="text"
        inputMode="decimal"
        placeholder={`New Value (${currencyCode})`} 
        value={val}
        onChange={(e) => setVal(formatIndianNumber(e.target.value))}
        className="flex-1 min-w-0"
      />
      <Button onClick={handleUpdate} disabled={loading || !val}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
      </Button>
    </div>
  );
}
