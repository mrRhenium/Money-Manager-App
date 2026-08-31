"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "antd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { upsertCurrency } from "@/actions/currency";
import { Plus, Pencil, Coins, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { message } from "antd";

const currencySchema = z.object({
  code: z.string().min(1, "Code is required").max(10).toUpperCase(),
  symbol: z.string().min(1, "Symbol is required"),
  name: z.string().min(1, "Name is required"),
  exchangeRate: z.any(),
  isActive: z.boolean(),
  isBase: z.boolean(),
});

export function CurrencyForm({ currency }: { currency?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: currency?.code || "",
      symbol: currency?.symbol || "",
      name: currency?.name || "",
      exchangeRate: currency?.exchangeRate || 1,
      isActive: currency?.isActive ?? true,
      isBase: currency?.isBase || false,
    },
  });

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = { ...values, _id: currency?._id };
      const res = await upsertCurrency(payload);
      if (res.success) {
        message.success(currency ? "Currency updated" : "Currency added");
        setOpen(false);
        if (!currency) form.reset();
      } else {
        message.error(res.error || "Failed to save currency");
      }
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {currency ? (
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Currency
          </Button>
        </DialogTrigger>
      )}
      <DialogContent initialFocus={false} size="md">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <span>{currency ? "Edit Currency" : "Add Currency"}</span>
          </DialogTitle>
          <DialogDescription>
            {currency ? "Update exchange rate or currency status" : "Configure a new global currency and exchange rate"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody className="space-y-4">
            <FormField
              control={form.control as any}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. USD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. $" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. US Dollar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="exchangeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate (1 Target = X Base)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} disabled={form.watch("isBase")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control as any}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="isBase"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                    <div className="space-y-0.5">
                      <FormLabel>Base Currency</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onChange={(val: boolean) => {
                          field.onChange(val);
                          if (val) form.setValue("exchangeRate", 1);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            </DialogBody>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 px-4 text-sm w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-5 text-sm font-semibold shadow-md w-full sm:w-auto" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {loading ? "Saving..." : "Save Currency"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
