"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { PenLine, Plus, Landmark, Calculator, PenTool } from "lucide-react";
import { getCurrentFormatted, formatDateString } from "@/lib/dateTimeHelper";
import { upsertLoan } from "@/actions/loan";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { ColorPicker, IconPicker } from "@/components/ui/IconColorPicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["taken", "given"]),
  principalAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)) && parseIndianNumber(val) > 0, "Valid amount required"),
  totalAmount: z.string(),
  emiAmount: z.string(),
  emiDate: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 31;
  }, "Must be between 1 and 31"),
  startDate: z.string().min(1, "Start Date is required"),
  tenureMonths: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, "Must be a positive number"),
  linkedAccountId: z.string().optional(),
  interestRate: z.string().optional(),
  interestType: z.string().optional(),
});

// Simple Interest: Total = P + (P × R × T / 1200), EMI = Total / T
function calcSimpleInterest(principal: number, rate: number, tenureMonths: number) {
  const totalInterest = (principal * rate * tenureMonths) / 1200;
  const totalPayable = principal + totalInterest;
  const emi = totalPayable / tenureMonths;
  return { totalPayable: Math.round(totalPayable), emi: Math.round(emi), totalInterest: Math.round(totalInterest) };
}

// Compound Interest (Reducing Balance): EMI = P × r × (1+r)^n / ((1+r)^n - 1)
function calcCompoundInterest(principal: number, rate: number, tenureMonths: number) {
  const r = rate / 12 / 100; // monthly rate
  if (r === 0) {
    return { totalPayable: principal, emi: Math.round(principal / tenureMonths), totalInterest: 0 };
  }
  const factor = Math.pow(1 + r, tenureMonths);
  const emi = principal * r * factor / (factor - 1);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;
  return { totalPayable: Math.round(totalPayable), emi: Math.round(emi), totalInterest: Math.round(totalInterest) };
}

export function LoanForm({ accounts, loan, onUpdate, triggerClassName }: { accounts: any[], loan?: any, onUpdate?: () => void, triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [color, setColor] = useState(loan?.color || "#eab308");
  const [icon, setIcon] = useState(loan?.icon || "landmark");
  const [currency, setCurrency] = useState(loan?.currency || "INR");
  const [calcMode, setCalcMode] = useState<"manual" | "auto">(loan?.calculationMode || "manual");
  const [autoCalc, setAutoCalc] = useState<{ totalPayable: number; emi: number; totalInterest: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: loan?.name || "",
      type: loan?.type || "taken",
      principalAmount: loan?.principalAmount ? formatIndianNumber(loan.principalAmount) : "",
      totalAmount: loan?.totalAmount ? formatIndianNumber(loan.totalAmount) : "",
      emiAmount: loan?.emiAmount ? formatIndianNumber(loan.emiAmount) : "",
      emiDate: loan?.emiDate ? loan.emiDate.toString() : "1",
      startDate: loan?.startDate ? formatDateString(loan.startDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
      tenureMonths: loan?.tenureMonths ? loan.tenureMonths.toString() : "12",
      linkedAccountId: loan?.linkedAccountId?._id || loan?.linkedAccountId || "",
      interestRate: loan?.interestRate ? loan.interestRate.toString() : "",
      interestType: loan?.interestType || "compound",
    },
  });

  const watchPrincipal = form.watch("principalAmount");
  const watchRate = form.watch("interestRate");
  const watchTenure = form.watch("tenureMonths");
  const watchInterestType = form.watch("interestType");

  // Auto-calculate when relevant fields change in auto mode
  useEffect(() => {
    if (calcMode !== "auto") return;

    const principal = parseIndianNumber(watchPrincipal);
    const rate = parseFloat(watchRate || "0");
    const tenure = parseInt(watchTenure || "0");

    if (principal > 0 && rate > 0 && tenure > 0) {
      const result = watchInterestType === "simple"
        ? calcSimpleInterest(principal, rate, tenure)
        : calcCompoundInterest(principal, rate, tenure);

      setAutoCalc(result);
      form.setValue("totalAmount", formatIndianNumber(result.totalPayable));
      form.setValue("emiAmount", formatIndianNumber(result.emi));
    } else {
      setAutoCalc(null);
    }
  }, [watchPrincipal, watchRate, watchTenure, watchInterestType, calcMode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const principal = parseIndianNumber(values.principalAmount);
    const total = parseIndianNumber(values.totalAmount);
    const emi = parseIndianNumber(values.emiAmount);

    // Validations
    if (total < principal) {
      form.setError("totalAmount", { message: "Total payable must be ≥ principal amount" });
      return;
    }
    if (emi > total) {
      form.setError("emiAmount", { message: "EMI cannot exceed total payable amount" });
      return;
    }
    if (emi <= 0) {
      form.setError("emiAmount", { message: "Valid EMI amount required" });
      return;
    }
    if (total <= 0) {
      form.setError("totalAmount", { message: "Valid total amount required" });
      return;
    }

    setLoading(true);
    try {
      await upsertLoan({
        _id: loan?._id,
        ...values,
        principalAmount: principal,
        totalAmount: total,
        emiAmount: emi,
        emiDate: parseInt(values.emiDate),
        tenureMonths: parseInt(values.tenureMonths),
        interestRate: values.interestRate ? parseFloat(values.interestRate) : undefined,
        interestType: values.interestType || undefined,
        calculationMode: calcMode,
        color,
        icon,
        currency
      });
      setOpen(false);
      form.reset();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save loan.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        name: loan?.name || "",
        type: loan?.type || "taken",
        principalAmount: loan?.principalAmount ? formatIndianNumber(loan.principalAmount) : "",
        totalAmount: loan?.totalAmount ? formatIndianNumber(loan.totalAmount) : "",
        emiAmount: loan?.emiAmount ? formatIndianNumber(loan.emiAmount) : "",
        emiDate: loan?.emiDate ? loan.emiDate.toString() : "1",
        startDate: loan?.startDate ? formatDateString(loan.startDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
        tenureMonths: loan?.tenureMonths ? loan.tenureMonths.toString() : "",
        linkedAccountId: loan?.linkedAccountId?._id || loan?.linkedAccountId || "",
        interestRate: loan?.interestRate ? loan.interestRate.toString() : "",
        interestType: loan?.interestType || "simple",
      });
      setCurrency(loan?.currency || "INR");
      setColor(loan?.color || "#eab308");
      setIcon(loan?.icon || "Landmark");
    }
    setOpen(newOpen);
  };

  const { format } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        loan ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={triggerClassName || "font-semibold shadow-md rounded-xl h-11 px-6"}>
            <Plus className="w-4 h-4 mr-2" />
            Add Loan
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Landmark className="w-5 h-5" />
            <span className="text-foreground">{loan ? "Edit Loan" : "New Loan"}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Calculation Mode Toggle */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border">
          <span className="text-sm font-medium text-muted-foreground mr-auto">Calculation Mode:</span>
          <Button
            type="button"
            variant={calcMode === "manual" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setCalcMode("manual")}
          >
            <PenTool className="w-3.5 h-3.5" /> Manual
          </Button>
          <Button
            type="button"
            variant={calcMode === "auto" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setCalcMode("auto")}
          >
            <Calculator className="w-3.5 h-3.5" /> Auto-Calculate
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "I Took a Loan (Liability)", value: "taken" },
                          { label: "I Gave a Loan (Asset)", value: "given" }
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Home Loan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="e.g. 10,00,000"
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        {...field}
                        onChange={(e) => field.onChange(formatIndianNumber(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {calcMode === "auto" ? (
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (% p.a.)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 8.5" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Payable (Inc. Interest)</FormLabel>
                      <FormControl>
                        <CurrencyInput 
                          placeholder="e.g. 12,00,000"
                          currency={currency}
                          onCurrencyChange={setCurrency}
                          {...field}
                          onChange={(e) => field.onChange(formatIndianNumber(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Interest Type — visible in auto mode */}
            {calcMode === "auto" && (
              <FormField
                control={form.control}
                name="interestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Calculation Method</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        value={field.value || "compound"}
                        onChange={field.onChange}
                        options={[
                          { label: "📊 Simple Interest — Flat Rate (Personal/Gold Loans)", value: "simple" },
                          { label: "🏦 Compound Interest — Reducing Balance EMI (Home/Car/Education Loans)", value: "compound" },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emiAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EMI Amount {calcMode === "auto" && "(Auto)"}</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="e.g. 15,000"
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        {...field}
                        onChange={(e) => field.onChange(formatIndianNumber(e.target.value))}
                        disabled={calcMode === "auto"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emiDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EMI Date (1-31)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto-Calc Live Preview */}
            {calcMode === "auto" && autoCalc && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Calculator className="w-4 h-4" /> Loan Calculation Summary
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monthly EMI</p>
                    <p className="font-bold text-foreground">{format(autoCalc.emi)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Interest</p>
                    <p className="font-bold text-red-500">{format(autoCalc.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Payable</p>
                    <p className="font-bold text-foreground">{format(autoCalc.totalPayable)}</p>
                  </div>
                </div>
                {autoCalc.totalInterest > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Interest to Principal Ratio: <span className="font-bold">{(autoCalc.totalInterest / parseIndianNumber(watchPrincipal) * 100).toFixed(1)}%</span> 
                    {" "}({watchInterestType === "simple" ? "Simple" : "Compound / Reducing Balance"})
                  </p>
                )}
              </div>
            )}

            {/* Show total payable as read-only in auto mode */}
            {calcMode === "auto" && (
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Payable (Auto-Calculated)</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="Auto-calculated"
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenureMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenure (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto/Linked Account</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        allowClear
                        placeholder="Select Account"
                        value={field.value || undefined}
                        onChange={field.onChange}
                        options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interest rate field in manual mode (optional, for display) */}
            {calcMode === "manual" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate % (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 8.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Type (Optional)</FormLabel>
                      <FormControl>
                        <Select
                          className="w-full h-10"
                          allowClear
                          placeholder="Select type"
                          value={field.value || undefined}
                          onChange={field.onChange}
                          options={[
                            { label: "Simple Interest", value: "simple" },
                            { label: "Compound Interest", value: "compound" },
                          ]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
               <ColorPicker value={color} onChange={setColor} id={`loanColor-${loan?._id || 'new'}`} />
               <IconPicker value={icon} onChange={setIcon} color={color} />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Saving..." : (loan ? "Save Changes" : "Create Loan")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
