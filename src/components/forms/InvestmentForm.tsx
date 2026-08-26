"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, Switch } from "antd";
import AsyncSelect from "react-select/async";
import { createInvestment, updateInvestment } from "@/actions/investment";
import { searchMutualFunds, searchStocks } from "@/actions/lookup";
import { Plus, TrendingUp, PenLine, Landmark, AlertCircle } from "lucide-react";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { IconPicker, ColorPicker } from "@/components/ui/IconColorPicker";
import { getCurrentFormatted, formatDateString, parseToDate } from "@/lib/dateTimeHelper";
import { useToast } from "@/hooks/useToast";
import { useCurrency } from "@/hooks/useCurrency";

const formSchema = z.object({
  investmentType: z.enum(["SIP", "MutualFund", "Stocks", "FD", "RD", "PPF", "EPF", "NPS", "Gold", "Crypto", "Bonds", "RealEstate", "Other"]),
  name: z.string().min(2, "Name is required"),
  folioNumber: z.string().optional(),
  platform: z.string().optional(),
  investedAmount: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num) && num > 0;
  }, "Invested amount must be greater than 0"),
  currentValue: z.string().refine(val => !isNaN(parseIndianNumber(val)), "Valid amount required"),
  units: z.string().optional(),
  schemeCode: z.string().optional(),
  ticker: z.string().optional(),
  autoPriceUpdateEnabled: z.boolean().default(true),
  startDate: z.string().min(1, "Start date required"),
  frequency: z.enum(["OneTime", "Monthly", "Quarterly", "Yearly"]),
  linkedAccountId: z.string().optional(),
});

export function InvestmentForm({ investment, accounts, triggerClassName }: { investment?: any, accounts: any[], triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(investment?.currency || "INR");
  const [color, setColor] = useState(investment?.color || "#8b5cf6");
  const [icon, setIcon] = useState(investment?.icon || "TrendingUp");
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const { toast } = useToast();
  const { format } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      investmentType: investment?.investmentType || "MutualFund",
      name: investment?.name || "",
      folioNumber: investment?.folioNumber || "",
      platform: investment?.platform || "",
      investedAmount: investment?.investedAmount ? investment.investedAmount.toString() : "",
      currentValue: investment?.currentValue ? investment.currentValue.toString() : "",
      units: investment?.units ? investment.units.toString() : "",
      schemeCode: investment?.schemeCode || "",
      ticker: investment?.ticker || "",
      autoPriceUpdateEnabled: investment?.autoPriceUpdateEnabled ?? true,
      startDate: investment?.startDate ? formatDateString(investment.startDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
      frequency: investment?.frequency || "OneTime",
      linkedAccountId: investment?.linkedAccountId || undefined,
    },
  });

  const watchType = form.watch("investmentType");
  const watchAutoUpdate = form.watch("autoPriceUpdateEnabled");
  const watchUnits = form.watch("units");
  const isAutoPricedAsset = watchType === "MutualFund" || watchType === "Stocks";

  useEffect(() => {
    if (assetPrice !== null && watchUnits && !isNaN(parseFloat(watchUnits))) {
      const val = parseFloat(watchUnits) * assetPrice;
      form.setValue("currentValue", formatIndianNumber(val.toString()), { shouldValidate: true });
    }
  }, [watchUnits, assetPrice, form]);

  const loadMutualFunds = async (inputValue: string) => {
    if (inputValue.length < 3) return [];
    const results = await searchMutualFunds(inputValue);
    return results.map((r: any) => ({
      label: r.fundHouse ? `${r.schemeName} (${r.fundHouse})` : r.schemeName,
      value: r.schemeCode,
      nav: r.latestNAV
    }));
  };

  const loadStocks = async (inputValue: string) => {
    if (inputValue.length < 2) return [];
    const results = await searchStocks(inputValue);
    return results.map((r: any) => ({
      label: `${r.companyName} (${r.ticker})`,
      value: r.ticker,
      price: r.latestPrice
    }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        investedAmount: parseIndianNumber(values.investedAmount),
        currentValue: parseIndianNumber(values.currentValue),
        units: values.units ? parseFloat(values.units) : undefined,
        currentPrice: assetPrice !== null ? assetPrice : undefined,
        startDate: parseToDate(values.startDate),
        currency,
        color,
        icon,
      };

      if (!isAutoPricedAsset) {
        payload.schemeCode = undefined;
        payload.ticker = undefined;
      }

      if (investment) {
        await updateInvestment(investment._id, payload);
      } else {
        await createInvestment(payload);
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save investment.");
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        investmentType: investment?.investmentType || "MutualFund",
        name: investment?.name || "",
        folioNumber: investment?.folioNumber || "",
        platform: investment?.platform || "",
        investedAmount: investment?.investedAmount ? investment.investedAmount.toString() : "",
        currentValue: investment?.currentValue ? investment.currentValue.toString() : "",
        units: investment?.units ? investment.units.toString() : "",
        schemeCode: investment?.schemeCode || "",
        ticker: investment?.ticker || "",
        autoPriceUpdateEnabled: investment?.autoPriceUpdateEnabled ?? true,
        startDate: investment?.startDate ? formatDateString(investment.startDate, "YYYY-MM-DD") : getCurrentFormatted("YYYY-MM-DD"),
        frequency: investment?.frequency || "OneTime",
        linkedAccountId: investment?.linkedAccountId || undefined,
      });
      setCurrency(investment?.currency || "INR");
      setColor(investment?.color || "#8b5cf6");
      setIcon(investment?.icon || "TrendingUp");
      setAssetPrice(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        investment ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={`w-full sm:w-auto ${triggerClassName || "font-semibold shadow-md rounded-xl h-11 px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"}`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="text-foreground">{investment ? "Edit Investment" : "Add New Investment"}</span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Class</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        options={[
                          { label: 'Mutual Fund', value: 'MutualFund' },
                          { label: 'Stocks', value: 'Stocks' },
                          { label: 'Fixed Deposit (FD)', value: 'FD' },
                          { label: 'PPF', value: 'PPF' },
                          { label: 'Gold', value: 'Gold' },
                          { label: 'Crypto', value: 'Crypto' },
                          { label: 'Other', value: 'Other' },
                        ]}
                        {...field}
                        onChange={(val) => {
                          field.onChange(val);
                          // Reset auto fields when switching types
                          form.setValue("schemeCode", "");
                          form.setValue("ticker", "");
                          if (val === "MutualFund" || val === "Stocks") {
                            form.setValue("autoPriceUpdateEnabled", true);
                          } else {
                            form.setValue("autoPriceUpdateEnabled", false);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAutoPricedAsset && (
                <FormField
                  control={form.control}
                  name={watchType === "MutualFund" ? "schemeCode" : "ticker"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search {watchType === "MutualFund" ? "Mutual Fund" : "Stock Symbol"}</FormLabel>
                      <FormControl>
                        <AsyncSelect
                          cacheOptions
                          defaultOptions={false}
                          loadOptions={watchType === "MutualFund" ? loadMutualFunds : loadStocks}
                          onChange={(option: any) => {
                            if (option) {
                              field.onChange(option.value);
                              form.setValue("name", option.label.split(' (')[0]);
                              if (option.nav || option.price) {
                                setAssetPrice(option.nav || option.price);
                              }
                            } else {
                              field.onChange("");
                              setAssetPrice(null);
                            }
                          }}
                          placeholder={`Type to search ${watchType === "MutualFund" ? "funds..." : "stocks..."}`}
                          className="text-sm"
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '40px',
                              borderRadius: '0.5rem',
                            })
                          }}
                        />
                      </FormControl>
                      {assetPrice !== null && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                          <TrendingUp className="w-3 h-3" /> Latest {watchType === "MutualFund" ? "NAV" : "Price"}: {format(assetPrice)}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">If not found, type the name manually below.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HDFC Midcap Opportunities" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isAutoPricedAsset && (
              <div className="bg-secondary/50 p-3 rounded-lg border flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Auto-update Price/NAV</h4>
                  <p className="text-xs text-muted-foreground">Automatically fetch the latest price daily.</p>
                </div>
                <FormField
                  control={form.control}
                  name="autoPriceUpdateEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {isAutoPricedAsset && form.getValues(watchType === "MutualFund" ? "schemeCode" : "ticker") === "" && watchAutoUpdate && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Auto price updates unavailable until this asset is selected from search. You will need to update value manually for now.
              </p>
            )}

            {/* If it is auto priced but search is empty, we still need to allow manual name entry */}
            {isAutoPricedAsset && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Fund or Stock Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="investedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invested Amount</FormLabel>
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

              {isAutoPricedAsset ? (
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity / Units Held</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 10.5"
                          {...field}
                          type="number"
                          step="any"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value {isAutoPricedAsset && watchAutoUpdate && "(Auto-calculated)"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 55,000"
                        {...field}
                        onChange={(e) => field.onChange(formatIndianNumber(e.target.value))}
                        readOnly={isAutoPricedAsset && watchAutoUpdate && form.getValues(watchType === "MutualFund" ? "schemeCode" : "ticker") !== ""}
                        className={isAutoPricedAsset && watchAutoUpdate && form.getValues(watchType === "MutualFund" ? "schemeCode" : "ticker") !== "" ? "bg-muted/50 cursor-not-allowed" : ""}
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Select
                        className="w-full h-10"
                        options={[
                          { label: 'One Time', value: 'OneTime' },
                          { label: 'Monthly (SIP)', value: 'Monthly' },
                          { label: 'Quarterly', value: 'Quarterly' },
                          { label: 'Yearly', value: 'Yearly' },
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

            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Linked Bank Account</FormLabel>
                  <FormControl>
                    <Select
                      allowClear
                      placeholder="Select account for auto-debits (optional)"
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
              <ColorPicker value={color} onChange={setColor} id={`investmentColor-${investment?._id || 'new'}`} />
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{investment ? "Save Changes" : "Save Investment"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
