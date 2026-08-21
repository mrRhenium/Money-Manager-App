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
import { createAccount, updateAccount } from "@/actions/account";
import { Plus, Landmark, PenLine, List, Banknote } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["bank", "cash", "card", "wallet"]),
  balance: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num);
  }, "Balance must be a valid number"),
});

export function AccountForm({ account }: { account?: any }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: account?.name || "",
      type: account?.type || "bank",
      balance: account?.balance !== undefined ? formatIndianNumber(account.balance) : "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const parsedPayload = {
        ...values,
        balance: parseIndianNumber(values.balance),
      };
      if (account?._id) {
        await updateAccount(account._id, parsedPayload);
      } else {
        await createAccount(parsedPayload);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save account", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        account ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Landmark className="w-5 h-5" />
            <span className="text-foreground">{account ? "Edit Account" : "Create New Account"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><PenLine className="w-4 h-4 text-muted-foreground" /> Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HDFC Bank" {...field} />
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
                  <FormLabel className="flex items-center gap-2"><List className="w-4 h-4 text-muted-foreground" /> Type</FormLabel>
                  <FormControl>
                    <Select
                      showSearch
                      placeholder="Select type"
                      className="w-full h-10"
                      optionFilterProp="label"
                      options={[
                        { label: 'Bank', value: 'bank' },
                        { label: 'Cash', value: 'cash' },
                        { label: 'Credit Card', value: 'card' },
                        { label: 'Wallet', value: 'wallet' },
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
                    <Input 
                      type="text" 
                      placeholder="e.g. 10,000"
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
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{account ? "Save Changes" : "Create Account"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
