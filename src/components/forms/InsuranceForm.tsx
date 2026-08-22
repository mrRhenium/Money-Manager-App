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
import { createInsurancePolicy, updateInsurancePolicy } from "@/actions/insurance";
import { Plus, Shield, PenLine, Landmark, Calendar, Activity } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";

const formSchema = z.object({
  type: z.enum(["Life", "Health", "Vehicle", "Home", "Travel", "Other"]),
  policyName: z.string().min(2, "Name is required"),
  provider: z.string().min(2, "Provider is required"),
  policyNumber: z.string().optional(),
  coverageAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)), "Valid amount required"),
  premiumAmount: z.string().refine(val => !isNaN(parseIndianNumber(val)), "Valid amount required"),
  premiumFrequency: z.enum(["Monthly", "Quarterly", "HalfYearly", "Yearly", "OneTime"]),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  linkedAccountId: z.string().optional(),
});

export function InsuranceForm({ policy, accounts, triggerClassName }: { policy?: any, accounts: any[], triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(policy?.currency || "INR");
  const [color, setColor] = useState(policy?.color || "#10b981");
  const [icon, setIcon] = useState(policy?.icon || "Shield");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: policy?.type || "Life",
      policyName: policy?.policyName || "",
      provider: policy?.provider || "",
      policyNumber: policy?.policyNumber || "",
      coverageAmount: policy?.coverageAmount ? policy.coverageAmount.toString() : "",
      premiumAmount: policy?.premiumAmount ? policy.premiumAmount.toString() : "",
      premiumFrequency: policy?.premiumFrequency || "Yearly",
      startDate: policy?.startDate ? new Date(policy.startDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      endDate: policy?.endDate ? new Date(policy.endDate).toISOString().slice(0,10) : undefined,
      renewalDate: policy?.renewalDate ? new Date(policy.renewalDate).toISOString().slice(0,10) : undefined,
      linkedAccountId: policy?.linkedAccountId || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        coverageAmount: parseIndianNumber(values.coverageAmount),
        premiumAmount: parseIndianNumber(values.premiumAmount),
        startDate: new Date(values.startDate),
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        renewalDate: values.renewalDate ? new Date(values.renewalDate) : undefined,
        currency,
        color,
        icon,
      };

      if (policy) {
        await updateInsurancePolicy(policy._id, payload);
      } else {
        await createInsurancePolicy(payload);
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        policy ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={triggerClassName || "font-semibold shadow-md rounded-xl h-11 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"}>
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            <span className="text-foreground">{policy ? "Edit Policy" : "Add New Policy"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Type</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        options={[
                          { label: 'Life / Term', value: 'Life' },
                          { label: 'Health / Medical', value: 'Health' },
                          { label: 'Vehicle / Motor', value: 'Vehicle' },
                          { label: 'Home / Property', value: 'Home' },
                          { label: 'Travel', value: 'Travel' },
                          { label: 'Other', value: 'Other' },
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
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider / Company</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. LIC, HDFC Ergo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Optima Secure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. POL-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverageAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage (Sum Assured)</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="e.g. 50,00,000"
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
                name="premiumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Amount</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 15,000"
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
                name="premiumFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Frequency</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        options={[
                          { label: 'Yearly', value: 'Yearly' },
                          { label: 'Half-Yearly', value: 'HalfYearly' },
                          { label: 'Quarterly', value: 'Quarterly' },
                          { label: 'Monthly', value: 'Monthly' },
                          { label: 'One Time', value: 'OneTime' },
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
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
                name="renewalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Renewal (Optional)</FormLabel>
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
                    <FormLabel>Maturity/End (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Linked Bank Account</FormLabel>
                  <FormControl>
                    <Select
                      allowClear
                      placeholder="Select account for premium payments (optional)"
                      className="w-full h-10"
                      options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <ColorPicker value={color} onChange={setColor} id={`insuranceColor-${policy?._id || 'new'}`} />
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{policy ? "Save Changes" : "Save Policy"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
