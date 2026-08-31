"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createRecurringBill, updateRecurringBill } from "@/actions/recurringBill";
import { Plus, PenLine, Repeat, Coins, Calendar, Wallet, Smartphone, Folder, Eye, Loader2 } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { getCurrentFormatted, formatDateString } from "@/lib/dateTimeHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  frequency: z.enum(["weekly", "bi-weekly", "monthly", "quarterly", "yearly"]),
  nextDueDate: z.string().min(1, "Due date is required"),
  autoPayPlatform: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  isActive: z.boolean().default(true),
  isAutoPay: z.boolean().default(false),
  isFixedAmount: z.boolean().default(true),
});

interface RecurringBillFormProps {
  accounts: any[];
  categories: any[];
  triggerClassName?: string;
  bill?: any;
  viewOnly?: boolean;
}

export function RecurringBillForm({ accounts, categories, triggerClassName, bill, viewOnly }: RecurringBillFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState(bill?.currency || "INR");
  const [color, setColor] = useState(bill?.color || "#6366f1");
  const [icon, setIcon] = useState(bill?.icon || "Repeat");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: bill?.name || "",
      amount: bill?.amount ? formatIndianNumber(bill.amount) : "",
      frequency: bill?.frequency || "monthly",
      nextDueDate: bill?.nextDueDate ? formatDateString(bill.nextDueDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
      autoPayPlatform: bill?.autoPayPlatform || "",
      categoryId: bill?.categoryId?._id || bill?.categoryId || "",
      accountId: bill?.accountId?._id || bill?.accountId || (accounts.length > 0 ? accounts[0]._id : ""),
      isActive: bill?.isActive !== undefined ? bill?.isActive : true,
      isAutoPay: bill?.isAutoPay !== undefined ? bill?.isAutoPay : false,
      isFixedAmount: bill?.isFixedAmount !== undefined ? bill?.isFixedAmount : true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const parsedPayload = {
        ...values,
        amount: parseIndianNumber(values.amount),
        categoryId: values.categoryId || undefined,
        accountId: values.accountId || undefined,
        color,
        icon,
      };

      if (bill?._id) {
        const res = await updateRecurringBill(bill._id, parsedPayload);
        if (res && !res.success) {
          toast.error(res.error || "Failed to update subscription");
          return;
        }
        toast.success("Subscription updated successfully!");
      } else {
        const res = await createRecurringBill(parsedPayload as any);
        if (res && !res.success) {
          toast.error(res.error || "Failed to create subscription");
          return;
        }
        toast.success("Subscription created successfully!");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save subscription");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        name: bill?.name || "",
        amount: bill?.amount ? formatIndianNumber(bill.amount) : "",
        frequency: bill?.frequency || "monthly",
        nextDueDate: bill?.nextDueDate ? formatDateString(bill.nextDueDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
        autoPayPlatform: bill?.autoPayPlatform || "",
        categoryId: bill?.categoryId?._id || bill?.categoryId || "",
        accountId: bill?.accountId?._id || bill?.accountId || (accounts.length > 0 ? accounts[0]._id : ""),
        isActive: bill?.isActive !== undefined ? bill?.isActive : true,
      });
      setCurrency(bill?.currency || "INR");
      setColor(bill?.color || "#6366f1");
      setIcon(bill?.icon || "Repeat");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        {bill ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            {viewOnly ? <Eye className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
          </Button>
        ) : (
          <Button className={`w-full sm:w-auto ${triggerClassName || ""}`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent initialFocus={false} size="lg">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <span className="text-foreground">{bill ? (viewOnly ? "View Subscription" : "Edit Subscription") : "Add Subscription"}</span>
          </DialogTitle>
          <DialogDescription>
            {bill ? (viewOnly ? "Details and billing cadence for this subscription" : "Update subscription amount, cycle, or auto-debit account") : "Track recurring payments, OTT subscriptions, and utilities"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (e.g., Netflix, Rent)</FormLabel>
                    <FormControl>
                      <Input disabled={viewOnly} placeholder="Subscription Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Coins className="w-4 h-4 text-muted-foreground" /> Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput disabled={viewOnly} 
                        placeholder="e.g. 649"
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Repeat className="w-4 h-4 text-muted-foreground" /> Frequency</FormLabel>
                    <FormControl>
                      <Select disabled={viewOnly}
                        className="w-full h-10"
                        options={[
                          { label: 'Weekly', value: 'weekly' },
                          { label: 'Monthly', value: 'monthly' },
                          { label: 'Yearly', value: 'yearly' },
                        ]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Next Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground" /> Category (Optional)</FormLabel>
                    <FormControl>
                      <Select disabled={viewOnly}
                        showSearch
                        allowClear
                        placeholder="Select category"
                        className="w-full h-10"
                        optionFilterProp="label"
                        options={categories.filter(c => c.type === "expense").map(cat => ({ label: cat.name, value: cat._id }))}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Wallet className="w-4 h-4 text-muted-foreground" /> Deduct From</FormLabel>
                    <FormControl>
                      <Select disabled={viewOnly}
                        showSearch
                        allowClear
                        placeholder="Select account"
                        className="w-full h-10"
                        optionFilterProp="label"
                        options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
                        {...field}
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
                name="isFixedAmount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[72px]">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">Fixed Amount</FormLabel>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Turn off if this is a variable bill (like electricity)
                      </p>
                    </div>
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!e.target.checked) form.setValue("isAutoPay", false);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAutoPay"
                render={({ field }) => (
                  <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[72px] ${!form.watch("isFixedAmount") ? "opacity-50 pointer-events-none bg-muted/50" : ""}`}>
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">Auto-Pay</FormLabel>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Automatically deduct on due date
                      </p>
                    </div>
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={!form.watch("isFixedAmount")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="autoPayPlatform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-muted-foreground" /> Auto-Pay Platform (Optional)</FormLabel>
                    <FormControl>
                      <Input disabled={viewOnly} placeholder="e.g. GPay, Amazon Pay, Credit Card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[72px]">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">Active Subscription</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Turn off to pause or stop tracking
                      </p>
                    </div>
                    <FormControl>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary cursor-pointer"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <ColorPicker disabled={viewOnly} value={color} onChange={setColor} id={`billColor-${bill?._id || 'new'}`} />
              <IconPicker disabled={viewOnly} value={icon} onChange={setIcon} />
            </div>

            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-[length:var(--font-size-modal-btn)]">
                {viewOnly ? "Close" : "Cancel"}
              </Button>
              {!viewOnly && (
                <Button type="submit" className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isLoading ? "Saving..." : (bill ? "Save Changes" : "Add Subscription")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
