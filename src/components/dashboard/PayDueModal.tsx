"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  Landmark,
  CreditCard,
  TrendingUp,
  Shield,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { formatDateString, getCurrentDate, parseToDate } from "@/lib/dateTimeHelper";
import { recordDuePayment, DuePaymentInput } from "@/actions/duePayment";

export interface DueItem {
  id?: string;
  title: string;
  subtitle?: string;
  amount: number;
  dueDate: Date | string;
  daysRemaining?: number;
  type: "loan_emi" | "loan_emi_receive" | "credit_card" | "sip" | "insurance" | "subscription";
  entityId?: string;
  linkedAccountId?: string;
  bankName?: string;
  last4Digits?: string;
}

interface PayDueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  due: DueItem | null;
  accounts?: any[];
  onSuccess?: () => void;
}

const TYPE_DETAILS: Record<string, { label: string; actionLabel: string; icon: any; color: string; bgColor: string }> = {
  loan_emi: {
    label: "Loan EMI",
    actionLabel: "Pay Loan EMI",
    icon: Landmark,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  loan_emi_receive: {
    label: "Loan EMI Receivable",
    actionLabel: "Record Received EMI",
    icon: Landmark,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  credit_card: {
    label: "Credit Card Bill",
    actionLabel: "Pay Card Bill",
    icon: CreditCard,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  sip: {
    label: "SIP Installment",
    actionLabel: "Pay SIP Installment",
    icon: TrendingUp,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  insurance: {
    label: "Insurance Premium",
    actionLabel: "Pay Premium",
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  subscription: {
    label: "Subscription Bill",
    actionLabel: "Pay Subscription",
    icon: RefreshCw,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  bank: "Bank Transfer / UPI",
  cash: "Cash",
  credit_card: "Credit Card",
  wallet: "Wallet",
};

export function PayDueModal({
  open,
  onOpenChange,
  due,
  accounts = [],
  onSuccess,
}: PayDueModalProps) {
  const { format, currencySymbol } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();

  const [amount, setAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "credit_card" | "wallet">("bank");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (due && open) {
      setAmount(due.amount ? due.amount.toString() : "");
      setPaymentDate(getCurrentDate().toISOString().split("T")[0]);
      setPaymentMode("bank");
      setErrorMessage("");

      const actionType = due.type === "loan_emi_receive" ? "EMI Received for" : "Payment for";
      setNote(`${actionType} ${due.title}`);

      // Auto-select linked account or fallback to first active account
      if (due.linkedAccountId && accounts.some((a) => String(a._id) === String(due.linkedAccountId))) {
        setAccountId(String(due.linkedAccountId));
      } else if (accounts.length > 0) {
        const defaultAcc = accounts.find((a) => a.type === "bank" || a.type === "checking" || a.type === "savings") || accounts[0];
        setAccountId(defaultAcc?._id ? String(defaultAcc._id) : "");
      } else {
        setAccountId("");
      }
    }
  }, [due, open, accounts]);

  if (!due) return null;

  const isReceivable = due.type === "loan_emi_receive";
  const typeConfig = TYPE_DETAILS[due.type] || {
    label: due.type,
    actionLabel: isReceivable ? "Receive Due" : "Pay Due",
    icon: Landmark,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
  };
  const DueIcon = typeConfig.icon;
  const isOverdue = due.dueDate ? parseToDate(due.dueDate) < getCurrentDate() : false;

  const selectedAccount = accounts.find((a) => String(a._id) === String(accountId));
  const numericAmount = parseFloat(amount) || 0;
  const isInsufficient = !isReceivable && selectedAccount && selectedAccount.balance < numericAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!due.entityId) {
      setErrorMessage("Cannot record payment: missing entity identifier.");
      return;
    }

    if (numericAmount <= 0) {
      setErrorMessage("Please enter an amount greater than zero.");
      return;
    }

    if (!accountId) {
      setErrorMessage("Please select an account.");
      return;
    }

    setLoading(true);
    try {
      const isToday = paymentDate === getCurrentDate().toISOString().split("T")[0];
      const payloadDate = paymentDate
        ? (isToday ? getCurrentDate().toISOString() : new Date(paymentDate).toISOString())
        : getCurrentDate().toISOString();

      const payload: DuePaymentInput = {
        dueType: due.type,
        entityId: due.entityId,
        amount: numericAmount,
        accountId,
        date: payloadDate,
        paymentMode,
        note: note.trim() || undefined,
      };

      const result = await recordDuePayment(payload);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to process payment.");
        toast.error(result.error || "Failed to process payment.");
        setLoading(false);
        return;
      }

      toast.success(isReceivable ? "Payment received successfully!" : "Payment recorded successfully!");
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={false} size="md" className="z-[60]">
        <DialogHeader>
          <DialogTitle>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}>
              <DueIcon className="w-4 h-4" />
            </div>
            <span className="truncate">{typeConfig.actionLabel}</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            {typeConfig.label}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <DialogBody className="space-y-4">
            {/* Due Item Overview Banner */}
            <div className="p-3 sm:p-4 rounded-xl bg-muted/40 border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm sm:text-base text-foreground truncate">{due.title}</span>
                <span className="font-bold text-sm sm:text-base text-foreground">{format(due.amount)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Due: {due.dueDate ? formatDateString(due.dueDate, "DD-MM-YYYY") : "N/A"}
                </span>
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="due-amount" className="text-xs font-semibold">
                  {isReceivable ? "Amount to Receive" : "Amount to Pay"}
                </Label>
                {numericAmount !== due.amount && (
                  <button
                    type="button"
                    onClick={() => setAmount(due.amount.toString())}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Reset to {format(due.amount)}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">
                  {currencySymbol || "₹"}
                </span>
                <Input
                  id="due-amount"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-sm font-semibold rounded-xl placeholder:font-normal placeholder:text-muted-foreground/35 dark:placeholder:text-muted-foreground/30"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Account Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {isReceivable ? "Deposit Into Account" : "Pay From Account"}
              </Label>
              <Select value={accountId} onValueChange={(val) => setAccountId(val || "")}>
                <SelectTrigger className="w-full h-10 text-xs sm:text-sm rounded-xl">
                  <SelectValue placeholder="Select an account">
                    {selectedAccount ? selectedAccount.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc: any) => {
                    const isAccActive = acc.isActive !== false && acc.status !== "inactive";
                    const accId = String(acc._id);
                    return (
                      <SelectItem key={accId} value={accId}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="truncate">{acc.name}</span>
                          <span className="text-muted-foreground font-medium text-xs">
                            {format(acc.balance || 0)} {!isAccActive ? " [Inactive]" : ""}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {isInsufficient && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Note: Selected account balance ({format(selectedAccount?.balance || 0)}) is lower than payment amount.
                </p>
              )}
            </div>

            {/* Payment Date & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payment-date" className="text-xs font-semibold">
                  Payment Date
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Mode</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(val: any) => setPaymentMode(val)}
                >
                  <SelectTrigger className="w-full h-10 text-xs sm:text-sm rounded-xl">
                    <SelectValue placeholder="Mode">
                      {PAYMENT_MODE_LABELS[paymentMode] || paymentMode}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer / UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Note / Description */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-note" className="text-xs font-semibold">
                Note / Reference
              </Label>
              <Input
                id="payment-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Loan installment payment"
                className="text-xs sm:text-sm rounded-xl"
              />
            </div>
          </DialogBody>

          {/* Fixed Sticky Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto h-10 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !numericAmount || !accountId}
              className="w-full sm:w-auto h-10 px-5 text-sm font-semibold shadow-md gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isReceivable ? "Confirm & Receive" : "Confirm & Pay"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
