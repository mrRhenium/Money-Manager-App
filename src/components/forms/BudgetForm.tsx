"use client";

import { useState, useEffect } from "react";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { upsertBudget } from "@/actions/budget";
import { Plus, Target, Folder, Banknote, CalendarDays, PenLine, Clock, Loader2 } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["monthly", "custom"]),
  month: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  rollover: z.boolean().default(false),
}).refine(data => {
  if (data.type === "monthly" && !data.month) return false;
  return true;
}, { message: "Month is required", path: ["month"] })
.refine(data => {
  if (data.type === "custom" && (!data.startDate || !data.endDate)) return false;
  return true;
}, { message: "Start and End dates are required", path: ["startDate"] })
.refine(data => {
  if (data.type === "custom" && data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, { message: "End date must be after start date", path: ["endDate"] });

interface BudgetFormProps {
  categories: any[];
  budget?: any;
  triggerClassName?: string;
}

export function BudgetForm({ categories, budget, triggerClassName }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor] = useState(budget?.color || "#f59e0b");
  const [icon, setIcon] = useState(budget?.icon || "PiggyBank");
  const [currency, setCurrency] = useState(budget?.currency || "INR");
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();
  
  const currentMonth = getCurrentFormatted("YYYY-MM");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      categoryId: budget?.categoryId?._id || budget?.categoryId || "",
      type: budget?.type || "monthly",
      month: budget?.month || currentMonth,
      startDate: budget?.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : "",
      endDate: budget?.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : "",
      amount: budget?.amount ? formatIndianNumber(budget.amount) : "",
      rollover: budget?.rollover || false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: budget?.categoryId?._id || budget?.categoryId || "",
        type: budget?.type || "monthly",
        month: budget?.month || currentMonth,
        startDate: budget?.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : "",
        endDate: budget?.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : "",
        amount: budget?.amount ? formatIndianNumber(budget.amount) : "",
        rollover: budget?.rollover || false,
      });
      setColor(budget?.color || "#f59e0b");
      setIcon(budget?.icon || "PiggyBank");
      setErrorMsg("");
    }
  }, [budget, open, form, currentMonth]);

  const budgetType = form.watch("type");
  const expenseCategories = categories.filter(c => c.type === "expense");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setErrorMsg("");
    try {
      setIsLoading(true);
      const parsedAmount = parseIndianNumber(values.amount);
      const res = await upsertBudget({
        _id: budget?._id,
        categoryId: values.categoryId,
        type: values.type,
        month: values.month,
        startDate: values.startDate,
        endDate: values.endDate,
        amount: parsedAmount,
        rollover: values.rollover,
        color,
        icon,
      });
      
      if (res && !res.success) {
        setErrorMsg(res.error || "Failed to save budget");
        toast.error(res.error || "Failed to save budget");
        return;
      }

      toast.success(budget ? "Budget updated successfully!" : "Budget created successfully!");
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to save budget", error);
      setErrorMsg(error.message || "An unexpected error occurred");
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        budget ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={triggerClassName || "gap-2"}>
            <Plus className="w-4 h-4" />
            New Budget
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Target className="w-5 h-5" />
            <span className="text-foreground">{budget ? "Edit Category Budget" : "Set Category Budget"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground" /> Category</FormLabel>
                    <FormControl>
                      <Select
                        showSearch
                        placeholder="Select expense category"
                        className="w-full h-10"
                        optionFilterProp="label"
                        options={expenseCategories.map(cat => ({ label: cat.name, value: cat._id }))}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> Budget Type</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        options={[
                          { label: "Monthly", value: "monthly" },
                          { label: "Custom Date Range", value: "custom" }
                        ]}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        type="text" 
                        placeholder="e.g. 5,000"
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        {...field}
                        onChange={(e) => {
                          field.onChange(formatIndianNumber(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {budgetType === "monthly" ? (
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Month</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <ColorPicker value={color} onChange={setColor} id={`budgetColor-${budget?._id || 'new'}`} />
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isLoading ? "Saving..." : (budget ? "Save Changes" : "Save Budget")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
