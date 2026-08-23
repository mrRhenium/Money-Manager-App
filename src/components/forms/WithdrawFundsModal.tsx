"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "antd";
import { withdrawFundsFromGoal } from "@/actions/goal";
import { createTransaction } from "@/actions/transaction";
import { useCurrency } from "@/hooks/useCurrency";
import { MinusCircle, Wallet } from "lucide-react";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

export function WithdrawFundsModal({ goal, accounts = [], onUpdate }: { goal: any, accounts?: any[], onUpdate: () => void }) {
  const { currencyCode } = useCurrency();
  const [currency, setCurrency] = useState(goal?.currency || "INR");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [note, setNote] = useState("");

  const handleWithdrawFunds = async () => {
    setError("");
    const numAmount = parseIndianNumber(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (!sourceAccountId || !destinationAccountId) {
      setError("Please select both source and destination accounts");
      return;
    }

    if (!note.trim()) {
      setError("Please provide a mandatory note/reason for this emergency withdrawal");
      return;
    }

    if (numAmount > goal.currentAmount) {
      setError(`You cannot withdraw more than the goal balance (${formatIndianNumber(goal.currentAmount.toString())})`);
      return;
    }
    
    setLoading(true);
    try {
      await withdrawFundsFromGoal(goal._id, numAmount, sourceAccountId, destinationAccountId, note);
      onUpdate();
      setOpen(false);
      setAmount("");
      setSourceAccountId("");
      setDestinationAccountId("");
      setNote("");
    } catch (err: any) {
      setError(err.message || "Failed to withdraw funds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full shadow-sm text-red-500 hover:text-red-600 hover:bg-red-50">
          <MinusCircle className="w-3 h-3" /> Withdraw
        </Button>
      } />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Wallet className="w-5 h-5 text-red-500" />
            <span className="text-foreground">Withdraw from {goal.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount to Withdraw</Label>
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
            <Label>From Account (Goal Location) *</Label>
            <Select
              className="w-full h-10"
              placeholder="Select account holding goal funds"
              value={sourceAccountId || undefined}
              onChange={setSourceAccountId}
              allowClear
              options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
            />
          </div>

          <div className="space-y-2">
            <Label>To Account (Emergency Destination) *</Label>
            <Select
              className="w-full h-10"
              placeholder="Select destination account"
              value={destinationAccountId || undefined}
              onChange={setDestinationAccountId}
              allowClear
              options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason/Note (Mandatory)</Label>
            <Input 
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Why are you withdrawing these funds?"
            />
          </div>
        </div>

          <Button variant="destructive" className="w-full mt-2" onClick={handleWithdrawFunds} disabled={loading || !amount || !sourceAccountId || !destinationAccountId || !note.trim()}>
            {loading ? "Withdrawing..." : "Confirm Withdrawal"}
          </Button>
      </DialogContent>
    </Dialog>
  );
}
