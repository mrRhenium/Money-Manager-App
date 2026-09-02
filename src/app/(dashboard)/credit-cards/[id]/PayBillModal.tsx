"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "antd";
import { payCreditCardStatement } from "@/actions/creditCard";
import { IndianRupee, Banknote, FileText, Landmark } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function PayBillModal({ cardId, outstanding, accounts, statements }: { cardId: string, outstanding: number, accounts: any[], statements: any[] }) {
  const { format, currencyCode } = useCurrency();
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
      <DialogContent initialFocus={false} size="md">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-foreground">Pay Credit Card Bill</span>
          </DialogTitle>
          <DialogDescription>
            Settle outstanding credit card statements from your bank accounts.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {error && <div className="text-sm text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Select Statement / Cycle</Label>
            <Select
              value={statementId}
              onChange={(val) => setStatementId(val || "")}
              showSearch
              placeholder="Select statement"
              className="w-full h-10"
              optionFilterProp="label"
              options={statements.length > 0 ? statements.map(s => ({
                label: `${s.statementMonth} - Due: ${format(s.totalAmount - s.amountPaid)}`,
                value: s._id
              })) : [{ label: 'No pending statements', value: 'none', disabled: true } as any]}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> Pay From Account</Label>
            <Select
              value={accountId}
              onChange={(val) => setAccountId(val || "")}
              showSearch
              placeholder="Select bank account"
              className="w-full h-10"
              optionFilterProp="label"
              options={accounts.map(a => ({
                label: `${a.name} (Bal: ${format(a.balance)})`,
                value: a._id
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Amount ({currencyCode})</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              min="0"
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-[length:var(--font-size-modal-btn)]">
            Cancel
          </Button>
          <Button className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" onClick={handlePay} disabled={loading || !statementId}>
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
