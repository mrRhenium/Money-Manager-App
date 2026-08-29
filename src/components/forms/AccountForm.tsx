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
import { createAccount, updateAccount } from "@/actions/account";
import { Plus, Landmark, PenLine, List, Banknote, Loader2 } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["bank", "cash", "card", "wallet", "investment", "saving", "other"]),
  balance: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num);
  }, "Balance must be a valid number"),
});

export function AccountForm({ account, triggerClassName }: { account?: any, triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState(account?.currency || "INR");
  const [color, setColor] = useState(account?.color || "#3b82f6");
  const [icon, setIcon] = useState(account?.icon || "landmark");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || "",
      type: account?.type || "bank",
      balance: account?.balance ? account.balance.toString() : "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: account?.name || "",
        type: account?.type || "bank",
        balance: account?.balance !== undefined ? account.balance.toString() : "",
      });
      setCurrency(account?.currency || "INR");
      setColor(account?.color || "#3b82f6");
      setIcon(account?.icon || "landmark");
    }
  }, [account, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const payload = {
        ...values,
        balance: parseIndianNumber(values.balance),
        color,
        icon,
        currency
      };

      if (account) {
        const res = await updateAccount(account._id, payload);
        if (res && !res.success) {
          toast.error(res.error || "Failed to update account");
          return;
        }
        toast.success("Account updated successfully!");
      } else {
        const res = await createAccount(payload);
        if (res && !res.success) {
          toast.error(res.error || "Failed to create account");
          return;
        }
        toast.success("Account created successfully!");
      }
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save account");
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
        account ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={`w-full sm:w-auto font-semibold shadow-md rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary ${triggerClassName || 'h-11 px-6'}`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Landmark className="w-5 h-5" />
            <span className="text-foreground">{account ? "Edit Account" : "Add New Account"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HDFC Salary" {...field} />
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
                  <FormLabel className="flex items-center gap-2"><List className="w-4 h-4 text-muted-foreground" /> Account Type</FormLabel>
                  <FormControl>
                    <Select
                      showSearch
                      placeholder="Select type"
                      className="w-full h-10"
                      optionFilterProp="label"
                      options={[
                        { label: 'Bank Account', value: 'bank' },
                        { label: 'Cash Wallet', value: 'cash' },
                        { label: 'Digital Wallet', value: 'wallet' },
                        { label: 'Savings & Deposits', value: 'saving' },
                        { label: 'Investment Portfolio', value: 'investment' },
                        { label: 'Other Account', value: 'other' },
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
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Initial Balance</FormLabel>
                  <FormControl>
                    <CurrencyInput 
                      placeholder="e.g. 10,000"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <ColorPicker value={color} onChange={setColor} id={`accountColor-${account?._id || 'new'}`} />
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isLoading ? "Saving..." : (account ? "Save Changes" : "Create Account")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
