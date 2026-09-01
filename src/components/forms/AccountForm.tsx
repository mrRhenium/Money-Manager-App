"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
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
    if (val === "" || val === undefined || val === null) return true;
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
      balance: account?.balance !== undefined ? formatIndianNumber(account.balance) : "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: account?.name || "",
        type: account?.type || "bank",
        balance: account?.balance !== undefined ? formatIndianNumber(account.balance) : "",
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
      <DialogContent initialFocus={false} size="md">
        <DialogHeader>
          <DialogTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-foreground">{account ? "Edit Account" : "Add New Account"}</span>
          </DialogTitle>
          <DialogDescription>
            {account ? "Update account balance, icon, and details" : "Configure a new bank, cash, or wallet account"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogBody className="space-y-4">
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
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={[
                          { label: 'Bank Account', value: 'bank' },
                          { label: 'Cash Wallet', value: 'cash' },
                          { label: 'Digital Wallet', value: 'wallet' },
                          { label: 'Savings & Deposits', value: 'saving' },
                          { label: 'Investment Portfolio', value: 'investment' },
                          { label: 'Other Account', value: 'other' },
                        ]}
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
                    <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> {account ? "Current Balance" : "Initial Balance"}</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="e.g. 10,000"
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        value={field.value}
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
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
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-[length:var(--font-size-modal-btn)]">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isLoading ? "Saving..." : (account ? "Save Changes" : "Create Account")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
