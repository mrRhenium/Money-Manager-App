"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, Plus, PenLine } from "lucide-react";
import { createGoal, updateGoal } from "@/actions/goal";
import { parseIndianNumber, formatIndianNumber } from "@/lib/numberHelper";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Select } from "antd";
import { ColorPicker, IconPicker } from "@/components/ui/IconColorPicker";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  deadline: z.string().optional(),
  color: z.string(),
  icon: z.string(),
});

const iconsList = [
  "Target", "Car", "Home", "Plane", "Umbrella", "GraduationCap", "Heart", "Briefcase", "Gift", "Coffee", "Laptop", "Gamepad2"
];

const colorsList = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function GoalForm({ goal, onUpdate }: { goal?: any, onUpdate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(goal?.currency || "INR");
  const { currencyCode } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: goal?.name || "",
      targetAmount: goal?.targetAmount ? formatIndianNumber(goal.targetAmount) : "",
      deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "",
      color: goal?.color || "#3b82f6",
      icon: goal?.icon || "Target",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        targetAmount: parseIndianNumber(values.targetAmount),
        currency: currency,
      };

      if (goal?._id) {
        await updateGoal(goal._id, payload);
      } else {
        await createGoal(payload);
      }
      setOpen(false);
      form.reset();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to save goal", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        goal ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="font-semibold shadow-md rounded-xl h-11 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Target className="w-5 h-5" />
            <span className="text-foreground">{goal ? "Edit Goal" : "New Savings Goal"}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vacation Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <CurrencyInput 
                      placeholder="e.g. 50,000" 
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
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
              <IconPicker value={form.watch("icon")} onChange={(val) => form.setValue("icon", val)} color={form.watch("color")} />
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <ColorPicker value={field.value} onChange={field.onChange} id="goalColor" />
                )}
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Saving..." : (goal ? "Save Changes" : "Create Goal")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
