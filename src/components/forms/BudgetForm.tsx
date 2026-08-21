"use client";

import { useState } from "react";
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
import { Plus, Target, Folder, Banknote, CalendarDays } from "lucide-react";

const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  rollover: z.boolean().default(false),
});

interface BudgetFormProps {
  categories: any[];
}

export function BudgetForm({ categories }: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  
  const currentMonth = getCurrentFormatted("YYYY-MM");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      categoryId: "",
      month: currentMonth,
      amount: 0,
      rollover: false,
    },
  });

  const expenseCategories = categories.filter(c => c.type === "expense");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await upsertBudget(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to set budget", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Set Budget
        </Button>
      } />
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Target className="w-5 h-5" />
            <span className="text-foreground">Set Category Budget</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                        }}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">Save Budget</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
