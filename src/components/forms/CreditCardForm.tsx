"use client";

import { useState } from "react";
import { getCurrentFormatted, parseToDate } from "@/lib/dateTimeHelper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createCreditCard, updateCreditCard } from "@/actions/creditCard";
import { Plus, CreditCard as CardIcon, Landmark, Tag, User, Hash, Banknote, Calendar, CalendarClock, CalendarDays, CalendarCheck, Palette, PenLine } from "lucide-react";

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

export function CreditCardForm({ card }: { card?: any }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      cardName: card?.cardName || "",
      bankName: card?.bankName || "",
      cardNetwork: card?.cardNetwork || "Visa",
      last4Digits: card?.last4Digits || "",
      cardholderName: card?.cardholderName || "",
      creditLimit: card?.creditLimit || 0,
      startingDate: card?.startingDate ? new Date(card.startingDate).toISOString().slice(0, 16) : getCurrentFormatted("YYYY-MM-DDTHH:mm"),
      expiryDate: card?.expiryDate ? new Date(card.expiryDate).toISOString().slice(0, 16) : "",
      billingCycleStartDay: card?.billingCycleStartDay || 1,
      billingCycleEndDay: card?.billingCycleEndDay || 30,
      paymentDueDay: card?.paymentDueDay || 15,
      color: card?.color || "#0ea5e9",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    
    // Validate Dates
    const start = parseToDate(values.startingDate);
    const end = parseToDate(values.expiryDate);
    if (end <= start) {
      setError("Expiry date must be after starting date.");
      return;
    }

    try {
      if (card?._id) {
        await updateCreditCard(card._id, values);
      } else {
        await createCreditCard(values);
      }
      setOpen(false);
      form.reset();
    } catch (err: any) {
      setError(err.message || "Failed to save credit card");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        card ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Add Credit Card
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-primary" />
            {card ? "Edit Credit Card" : "Register Credit Card"}
          </DialogTitle>
        </DialogHeader>

        {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> Bank Name</FormLabel><FormControl><Input placeholder="e.g. HDFC Bank" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cardName" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Card Nickname</FormLabel><FormControl><Input placeholder="e.g. Regalia Gold" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="cardholderName" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Name on Card</FormLabel><FormControl><Input placeholder="Enter name on card" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cardNetwork" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><CardIcon className="w-4 h-4 text-muted-foreground" /> Network</FormLabel>
                  <FormControl>
                    <Select
                      showSearch
                      placeholder="Select network"
                      className="w-full h-10"
                      optionFilterProp="label"
                      options={[
                        { label: 'Visa', value: 'Visa' },
                        { label: 'Mastercard', value: 'Mastercard' },
                        { label: 'RuPay', value: 'RuPay' },
                        { label: 'Amex', value: 'Amex' },
                        { label: 'Other', value: 'Other' },
                      ]}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="last4Digits" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Hash className="w-4 h-4 text-muted-foreground" /> Last 4 Digits</FormLabel><FormControl>
                  <Input 
                    placeholder="1234" 
                    maxLength={4} 
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    {...field} 
                  />
                </FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="creditLimit" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Credit Limit (₹)</FormLabel><FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    {...field} 
                  />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="startingDate" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Issue Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-muted-foreground" /> Expiry Date</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-muted/20">
              <div className="col-span-full mb-2">
                <h4 className="text-sm font-semibold">Billing Cycle (Days of Month)</h4>
              </div>
              <FormField control={form.control} name="billingCycleStartDay" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> Start Day</FormLabel><FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={31} 
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    {...field} 
                  />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="billingCycleEndDay" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-muted-foreground" /> End/Statement Day</FormLabel><FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={31} 
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    {...field} 
                  />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paymentDueDay" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-muted-foreground" /> Due Date</FormLabel><FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={31} 
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    {...field} 
                  />
                </FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem><FormLabel className="flex items-center gap-2"><Palette className="w-4 h-4 text-muted-foreground" /> Card Visual Color</FormLabel><FormControl>
                <div className="flex gap-2"><Input type="color" id="creditCardColorInput" className="w-12 h-10 p-1" {...field} /><Input {...field} onClick={() => document.getElementById("creditCardColorInput")?.click()} /></div>
              </FormControl><FormMessage /></FormItem>
            )} />

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{card ? "Save Changes" : "Register Card"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
