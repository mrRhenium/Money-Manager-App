"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { Plus, Landmark, PenLine } from "lucide-react";
import { upsertLoan } from "@/actions/loan";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { ColorPicker } from "@/components/ui/IconColorPicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useCurrency } from "@/hooks/useCurrency";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const iconsList = [
  "Landmark", "Banknote", "Wallet", "CreditCard", "Building", "Home", "Car", "Briefcase", "GraduationCap", "User"
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["taken", "given"]),
  principalAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)) && parseIndianNumber(val) > 0, "Valid amount required"),
  totalAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)) && parseIndianNumber(val) > 0, "Valid amount required"),
  emiAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)) && parseIndianNumber(val) > 0, "Valid amount required"),
  emiDate: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 31;
  }, "Must be between 1 and 31"),
  startDate: z.string().min(1, "Start Date is required"),
  tenureMonths: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, "Must be a positive number"),
  linkedAccountId: z.string().optional(),
});

export function LoanForm({ accounts, loan, onUpdate }: { accounts: any[], loan?: any, onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(loan?.color || "#3b82f6");
  const [icon, setIcon] = useState(loan?.icon || "Landmark");
  const [currency, setCurrency] = useState(loan?.currency || "INR");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: loan?.name || "",
      type: loan?.type || "taken",
      principalAmount: loan?.principalAmount ? formatIndianNumber(loan.principalAmount) : "",
      totalAmount: loan?.totalAmount ? formatIndianNumber(loan.totalAmount) : "",
      emiAmount: loan?.emiAmount ? formatIndianNumber(loan.emiAmount) : "",
      emiDate: loan?.emiDate ? loan.emiDate.toString() : "1",
      startDate: loan?.startDate ? new Date(loan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tenureMonths: loan?.tenureMonths ? loan.tenureMonths.toString() : "12",
      linkedAccountId: loan?.linkedAccountId?._id || loan?.linkedAccountId || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await upsertLoan({
        _id: loan?._id,
        ...values,
        principalAmount: parseIndianNumber(values.principalAmount),
        totalAmount: parseIndianNumber(values.totalAmount),
        emiAmount: parseIndianNumber(values.emiAmount),
        emiDate: parseInt(values.emiDate),
        tenureMonths: parseInt(values.tenureMonths),
        color,
        icon,
        currency
      });
      setOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to save loan", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        loan ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="font-semibold shadow-md rounded-xl h-11 px-6">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emiAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EMI Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="e.g. 15,000"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
               <ColorPicker value={color} onChange={setColor} id="loanColor" />
               <div className="flex flex-col gap-2">
                 <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Icon</FormLabel>
                 <Select
                   className="w-full h-10"
                   value={icon}
                   onChange={setIcon}
                   options={iconsList.map(i => ({
                     label: (
                       <div className="flex items-center gap-2">
                         <CategoryIcon name={i} className="w-4 h-4" color={color} />
                         <span>{i}</span>
                       </div>
                     ),
                     value: i
                   }))}
                 />
               </div>
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
