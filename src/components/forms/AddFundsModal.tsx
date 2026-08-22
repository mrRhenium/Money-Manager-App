"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFundsToGoal } from "@/actions/goal";
import { createTransaction } from "@/actions/transaction";
import { useCurrency } from "@/hooks/useCurrency";
import { PlusCircle, Wallet } from "lucide-react";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

export function AddFundsModal({ goal, onUpdate }: { goal: any, onUpdate: () => void }) {
  const { currencyCode } = useCurrency();
  const [currency, setCurrency] = useState(goal?.currency || "INR");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddFunds = async () => {
    setError("");
    const numAmount = parseIndianNumber(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setLoading(true);
    try {
      await addFundsToGoal(goal._id, numAmount);
      onUpdate();
      setOpen(false);
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Failed to add funds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full shadow-sm">
          <PlusCircle className="w-3 h-3" /> Add Funds
        </Button>
      } />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Wallet className="w-5 h-5" />
            <span className="text-foreground">Fund {goal.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount to Add</Label>
            <CurrencyInput 
              value={amount} 
              currency={currency}
              onCurrencyChange={setCurrency}
              onChange={e => setAmount(formatIndianNumber(e.target.value))} 
              placeholder="e.g. 5,000" 
              autoFocus
            />
          </div>

          <Button className="w-full mt-2" onClick={handleAddFunds} disabled={loading || !amount}>
            {loading ? "Adding..." : "Confirm Addition"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
