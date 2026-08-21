"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCreditCard } from "@/actions/creditCard";
import { Plus, CreditCard as CardIcon } from "lucide-react";

const formSchema = z.object({
  cardName: z.string().min(2, "Name must be at least 2 characters"),
  bankName: z.string().min(2, "Bank name required"),
  cardNetwork: z.enum(["Visa", "Mastercard", "RuPay", "Amex", "Other"]),
  last4Digits: z.string().regex(/^\d{4}$/, "Must be exactly 4 digits"),
  cardholderName: z.string().min(2, "Cardholder name required"),
  creditLimit: z.coerce.number().min(1, "Credit limit required"),
  startingDate: z.string().min(1, "Starting date required"),
  expiryDate: z.string().min(1, "Expiry date required"),
  billingCycleStartDay: z.coerce.number().min(1).max(31),
  billingCycleEndDay: z.coerce.number().min(1).max(31),
  paymentDueDay: z.coerce.number().min(1).max(31),
  color: z.string(),
});

export function CreditCardForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      cardName: "",
      bankName: "",
      cardNetwork: "Visa",
      last4Digits: "",
      cardholderName: "",
      creditLimit: 0,
      startingDate: new Date().toISOString().split('T')[0],
      expiryDate: "",
      billingCycleStartDay: 1,
      billingCycleEndDay: 30,
      paymentDueDay: 15,
      color: "#0ea5e9",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    
    // Validate Dates
    const start = new Date(values.startingDate);
    const end = new Date(values.expiryDate);
    if (end <= start) {
      setError("Expiry date must be after starting date.");
      return;
    }

    try {
      await createCreditCard(values);
      setOpen(false);
      form.reset();
    } catch (err: any) {
      setError(err.message || "Failed to create credit card");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Credit Card
        </Button>
      } />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-primary" />
            Register Credit Card
          </DialogTitle>
        </DialogHeader>

        {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. HDFC Bank" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cardName" render={({ field }) => (
                <FormItem><FormLabel>Card Nickname</FormLabel><FormControl><Input placeholder="e.g. Regalia Gold" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="cardholderName" render={({ field }) => (
                <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cardNetwork" render={({ field }) => (
                <FormItem>
                  <FormLabel>Network</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="RuPay">RuPay</SelectItem>
                      <SelectItem value="Amex">Amex</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last4Digits" render={({ field }) => (
                <FormItem><FormLabel>Last 4 Digits</FormLabel><FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="creditLimit" render={({ field }) => (
                <FormItem><FormLabel>Credit Limit (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="startingDate" render={({ field }) => (
                <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-muted/20">
              <div className="col-span-full mb-2">
                <h4 className="text-sm font-semibold">Billing Cycle (Days of Month)</h4>
              </div>
              <FormField control={form.control} name="billingCycleStartDay" render={({ field }) => (
                <FormItem><FormLabel>Start Day</FormLabel><FormControl><Input type="number" min={1} max={31} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="billingCycleEndDay" render={({ field }) => (
                <FormItem><FormLabel>End/Statement Day</FormLabel><FormControl><Input type="number" min={1} max={31} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paymentDueDay" render={({ field }) => (
                <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="number" min={1} max={31} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem><FormLabel>Card Visual Color</FormLabel><FormControl>
                <div className="flex gap-2"><Input type="color" className="w-12 h-10 p-1" {...field} /><Input {...field} /></div>
              </FormControl><FormMessage /></FormItem>
            )} />

            <Button type="submit" className="w-full">Register Card</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
