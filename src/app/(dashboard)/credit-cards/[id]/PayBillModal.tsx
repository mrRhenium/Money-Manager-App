"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "antd";
import { payCreditCardStatement } from "@/actions/creditCard";
import { IndianRupee } from "lucide-react";

export function PayBillModal({ cardId, outstanding, accounts, statements }: { cardId: string, outstanding: number, accounts: any[], statements: any[] }) {
  const [open, setOpen] = useState(false);
  const [statementId, setStatementId] = useState(statements[0]?._id || "");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setError("");
    if (!statementId || !accountId || !amount) {
      setError("Please fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      await payCreditCardStatement(statementId, accountId, Number(amount));
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="w-full gap-2" variant="default" disabled={outstanding === 0}>
          <IndianRupee className="w-4 h-4" /> Pay Bill
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Credit Card Bill</DialogTitle>
        </DialogHeader>
        
        {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Statement / Cycle</Label>
            <Select 
              value={statementId} 
              onChange={(val) => setStatementId(val || "")}
              showSearch
              placeholder="Select statement"
              className="w-full h-10"
              optionFilterProp="label"
              options={statements.length > 0 ? statements.map(s => ({
                label: `${s.statementMonth} - Due: ₹${(s.totalAmount - s.amountPaid).toLocaleString()}`,
                value: s._id
              })) : [{ label: 'No pending statements', value: 'none', disabled: true } as any]}
            />
          </div>

          <div className="space-y-2">
            <Label>Pay From Account</Label>
            <Select 
              value={accountId} 
              onChange={(val) => setAccountId(val || "")}
              showSearch
              placeholder="Select bank account"
              className="w-full h-10"
              optionFilterProp="label"
              options={accounts.map(a => ({
                label: `${a.name} (Bal: ₹${a.balance.toLocaleString()})`,
                value: a._id
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input 
              type="number" 
              value={amount} 
              min="0"
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
              onChange={e => setAmount(e.target.value)} 
              placeholder="e.g. 5000" 
            />
          </div>

          <Button className="w-full mt-4" onClick={handlePay} disabled={loading || !statementId}>
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
