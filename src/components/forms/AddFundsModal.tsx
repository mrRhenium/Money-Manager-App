"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "antd";
import { addFundsToGoal } from "@/actions/goal";
import { createTransaction } from "@/actions/transaction";
import { useCurrency } from "@/hooks/useCurrency";
import { PlusCircle, Wallet } from "lucide-react";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

export function AddFundsModal({ goal, accounts = [], onUpdate }: { goal: any, accounts?: any[], onUpdate: () => void }) {
  const { currencyCode } = useCurrency();
  const [currency, setCurrency] = useState(goal?.currency || "INR");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");

  const handleAddFunds = async () => {
    setError("");
    const numAmount = parseIndianNumber(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const remaining = goal.targetAmount - goal.currentAmount;
    if (numAmount > remaining) {
      setError(`You can only add up to ${formatIndianNumber(remaining)} to reach your goal target.`);
      return;
    }

    if (sourceAccountId) {
      const sourceAcc = accounts.find(a => a._id === sourceAccountId);
      if (sourceAcc && numAmount > sourceAcc.balance) {
        setError(`Insufficient balance in source account (${formatIndianNumber(sourceAcc.balance)})`);
        return;
      }
    }
    
    setLoading(true);
    try {
      await addFundsToGoal(goal._id, numAmount, sourceAccountId || undefined, destinationAccountId || undefined);
      onUpdate();
      setOpen(false);
      setAmount("");
      setSourceAccountId("");
      setDestinationAccountId("");
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
      <DialogContent initialFocus={false} size="sm">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="truncate">Fund {goal.name}</span>
          </DialogTitle>
          <DialogDescription>
            Allocate money to accelerate your savings progress.
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody className="space-y-4">
          {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}

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

          <div className="space-y-2">
            <Label>From Account (Optional)</Label>
            <Select
              className="w-full h-10"
              placeholder="Select source account"
              value={sourceAccountId || undefined}
              onChange={setSourceAccountId}
              allowClear
              options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
            />
          </div>

          <div className="space-y-2">
            <Label>To Account (Optional)</Label>
            <Select
              className="w-full h-10"
              placeholder="Select destination account"
              value={destinationAccountId || undefined}
              onChange={setDestinationAccountId}
              allowClear
              options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-[length:var(--font-size-modal-btn)]">
            Cancel
          </Button>
          <Button className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" onClick={handleAddFunds} disabled={loading || !amount}>
            {loading ? "Adding..." : "Confirm Addition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
