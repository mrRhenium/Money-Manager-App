"use client";

import { useState } from "react";
import { getCurrentFormatted, parseToDate, formatDateString } from "@/lib/dateTimeHelper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { useRef } from "react";
import Tesseract from "tesseract.js";
import { Camera, Loader2, Plus, Tags, Banknote, Coins, Landmark, Folder, Calendar, AlignLeft, ReceiptText, QrCode, Users, PenLine, Trash, UploadCloud, CreditCard } from "lucide-react";
import { ScanAndPayModal } from "../upi/ScanAndPayModal";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCurrency } from "@/hooks/useCurrency";

const formSchema = z.object({
  type: z.enum(["income", "expense", "lend", "borrow", "settlement", "transfer"]),
  amount: z.string().refine(val => {
    const num = parseIndianNumber(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  originalCurrency: z.string().default("INR"),
  paymentMode: z.enum(["bank", "cash", "credit_card", "wallet"]).default("bank"),
  accountId: z.string().optional(),
  creditCardId: z.string().optional(),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  personId: z.string().optional(),
  note: z.string().optional(),
  date: z.string(),
}).refine(data => {
  if (data.type === "transfer") return !!data.accountId;
  if (data.paymentMode === "credit_card") return !!data.creditCardId;
  return !!data.accountId;
}, { message: "Payment source is required", path: ["accountId"] })
.refine(data => {
  if (data.type === "transfer") return !!data.toAccountId;
  return true;
}, { message: "Destination account is required", path: ["toAccountId"] });

interface TransactionFormProps {
  accounts: any[];
  categories: any[];
  people?: any[];
  creditCards?: any[];
  triggerClassName?: string;
  transaction?: any;
}

export function TransactionForm({ accounts, categories, people = [], creditCards = [], triggerClassName, transaction }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanPayOpen, setScanPayOpen] = useState(false);
  const [billImage, setBillImage] = useState<string>(transaction?.billImage || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currencyCode } = useCurrency();
  const [currency, setCurrency] = useState(transaction?.originalCurrency || "INR");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: transaction?.type || "expense",
      amount: transaction?.originalAmount ? formatIndianNumber(transaction.originalAmount) : (transaction?.amount ? formatIndianNumber(transaction.amount) : ""),
      originalCurrency: transaction?.originalCurrency || "INR",
      paymentMode: transaction?.paymentMode || (transaction?.creditCardId ? "credit_card" : "bank"),
      accountId: transaction?.accountId?._id || transaction?.accountId || (accounts.length > 0 ? accounts[0]._id : ""),
      creditCardId: transaction?.creditCardId?._id || transaction?.creditCardId || "",
      toAccountId: transaction?.toAccountId?._id || transaction?.toAccountId || "",
      categoryId: transaction?.categoryId?._id || transaction?.categoryId || "",
      personId: transaction?.personId?._id || transaction?.personId || "",
      note: transaction?.note || "",
      date: transaction?.date ? formatDateString(transaction.date, "YYYY-MM-DDTHH:mm") : getCurrentFormatted("YYYY-MM-DDTHH:mm"),
    },
  });

  const selectedType = form.watch("type");
  const selectedPaymentMode = form.watch("paymentMode");
  const watchedOriginalCurrency = form.watch("originalCurrency");
  const filteredCategories = categories.filter(c => c.type === selectedType || selectedType === "lend" || selectedType === "borrow" || selectedType === "settlement");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsUploading(true);
    try {
      // 1. Scan for amount
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text;
      
      const amountMatches = text.match(/(?:total|amount|pay|paid|rs\.?|\$|₹|€|£)\s*:?\s*(\d+[\.,]\d{2})/i) 
                            || text.match(/(\d+\.\d{2})/g);
      
      if (amountMatches && amountMatches.length > 0) {
        const numbers = (text.match(/\d+\.\d{2}/g) || []).map(Number);
        const maxAmount = numbers.length > 0 ? Math.max(...numbers) : 0;
        
        if (maxAmount > 0) {
          form.setValue("amount", formatIndianNumber(maxAmount));
          form.setValue("note", "Scanned from receipt");
          form.setValue("date", getCurrentFormatted("YYYY-MM-DDTHH:mm"));
        }
      }

      // 2. Upload image to Cloudinary
      const uploadedUrl = await uploadImageToCloudinary(file, "money-manager/receipts");
      setBillImage(uploadedUrl);

    } catch (err) {
      console.error("Scanning or uploading failed", err);
    } finally {
      setIsScanning(false);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (values.type === "transfer" && values.accountId === values.toAccountId) {
        form.setError("toAccountId", { message: "Cannot transfer to the same account" });
        return;
      }
      if (values.type === "transfer" && !values.toAccountId) {
        form.setError("toAccountId", { message: "Destination account is required" });
        return;
      }

      const parsedPayload = {
        ...values,
        amount: parseIndianNumber(values.amount),
        categoryId: values.type === "transfer" ? undefined : (values.categoryId || undefined),
        personId: values.type === "transfer" ? undefined : (values.personId || undefined),
        toAccountId: values.type === "transfer" ? values.toAccountId : undefined,
        accountId: values.type === "transfer" ? values.accountId : (values.paymentMode !== "credit_card" ? values.accountId : undefined),
        creditCardId: values.type !== "transfer" && values.paymentMode === "credit_card" ? values.creditCardId : undefined,
        paymentMode: values.type === "transfer" ? "bank" : values.paymentMode,
        billImage,
      };

      if (transaction?._id) {
        await updateTransaction(transaction._id, parsedPayload);
      } else {
        await createTransaction(parsedPayload);
      }
      setOpen(false);
      form.reset();
      setBillImage("");
      setErrorMsg("");
      setOpen(false);
    } catch (error: any) {
      setErrorMsg(error?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        type: transaction?.type || "expense",
        amount: transaction?.amount ? formatIndianNumber(transaction.amount) : "",
        originalCurrency: transaction?.originalCurrency || "INR",
        paymentMode: transaction?.paymentMode || "bank",
        accountId: transaction?.accountId?._id || transaction?.accountId || "",
        creditCardId: transaction?.creditCardId?._id || transaction?.creditCardId || "",
        toAccountId: transaction?.toAccountId?._id || transaction?.toAccountId || "",
        categoryId: transaction?.categoryId?._id || transaction?.categoryId || "",
        personId: transaction?.personId?._id || transaction?.personId || "",
        note: transaction?.note || "",
        date: transaction?.date ? formatDateString(transaction.date, "YYYY-MM-DDTHH:mm") : getCurrentFormatted("YYYY-MM-DDTHH:mm"),
      });
      setBillImage(transaction?.billImage || "");
      setErrorMsg("");
      setCurrency(transaction?.originalCurrency || "INR");
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        transaction ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <PenLine className="w-4 h-4" />
          </Button>
        ) : (
          <Button className={triggerClassName}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )
      } />
      <DialogContent initialFocus={false} className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ReceiptText className="w-5 h-5" />
            <span className="text-foreground">{transaction ? "Edit Transaction" : "Log Transaction"}</span>
          </DialogTitle>
        </DialogHeader>
        
        {errorMsg && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {errorMsg}
          </div>
        )}
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Smart Billing & Payments</h4>
              <p className="text-xs text-muted-foreground">Upload receipt to autofill or scan a UPI QR code</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto shadow-sm text-xs h-9 px-3" onClick={() => fileInputRef.current?.click()} disabled={isScanning || isUploading}>
              {(isScanning || isUploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
              {(isScanning || isUploading) ? "Processing..." : "Scan & Upload Bill"}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto shadow-sm text-xs h-9 px-3 border-primary/20 hover:bg-primary/5 hover:text-primary" onClick={() => setScanPayOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Pay
            </Button>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
        
        {billImage && (
          <div className="relative w-full h-32 rounded-lg border overflow-hidden mt-4 group">
            <img src={billImage} alt="Uploaded Bill" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Button variant="destructive" size="sm" onClick={() => setBillImage("")}>
                 <Trash className="w-4 h-4 mr-2" /> Remove Bill
               </Button>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Type and Category / People */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Tags className="w-4 h-4 text-muted-foreground" /> Type</FormLabel>
                    <FormControl>
                      <Select
                        showSearch
                        placeholder="Select type"
                        className="w-full h-10"
                        optionFilterProp="label"
                        options={[
                          { label: 'Expense', value: 'expense' },
                          { label: 'Income', value: 'income' },
                          { label: 'Transfer', value: 'transfer' },
                          { label: 'Lend', value: 'lend' },
                          { label: 'Borrow', value: 'borrow' },
                          { label: 'Settlement', value: 'settlement' },
                        ]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedType !== "transfer" && (
                (selectedType === "expense" || selectedType === "income") ? (
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground" /> Category</FormLabel>
                        <FormControl>
                          <Select
                            showSearch
                            placeholder="Select category"
                            className="w-full h-10"
                            optionFilterProp="label"
                            options={filteredCategories.map(cat => ({ label: cat.name, value: cat._id }))}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Person</FormLabel>
                        <FormControl>
                          <Select
                            showSearch
                            placeholder="Select person"
                            className="w-full h-10"
                            optionFilterProp="label"
                            options={people.map(p => ({ label: p.name, value: p._id }))}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              )}
            </div>

            {/* Optional Person for Expense/Income */}
            {selectedType !== "transfer" && (selectedType === "expense" || selectedType === "income") && (
              <FormField
                control={form.control}
                name="personId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Related Person (Optional)</FormLabel>
                    <FormControl>
                      <Select
                        showSearch
                        allowClear
                        placeholder="Tag a person (e.g., spent on Family)"
                        className="w-full h-10"
                        optionFilterProp="label"
                        options={people.map(p => ({ label: p.name, value: p._id }))}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Row 2: Currency and Amount */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="e.g. 1,50,000"
                        currency={watchedOriginalCurrency || "INR"}
                        onCurrencyChange={(val) => form.setValue("originalCurrency", val)}
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
            </div>

            {/* Row 3: Account/Card and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedType !== "transfer" && (
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Payment Mode</FormLabel>
                      <FormControl>
                        <Select
                          showSearch
                          placeholder="Select mode"
                          className="w-full h-10"
                          options={[
                            { label: 'Bank / Cash', value: 'bank' },
                            { label: 'Credit Card', value: 'credit_card' },
                          ]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedPaymentMode === "credit_card" && selectedType !== "transfer" ? (
                <FormField
                  control={form.control}
                  name="creditCardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Credit Card</FormLabel>
                      <FormControl>
                        <Select
                          showSearch
                          placeholder="Select credit card"
                          className="w-full h-10"
                          optionFilterProp="label"
                          options={creditCards.map(c => ({ label: `${c.bankName} - ${c.cardName}`, value: c._id }))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> {selectedType === "transfer" ? "From Account" : "Account"}</FormLabel>
                      <FormControl>
                        <Select
                          showSearch
                          placeholder="Select account"
                          className="w-full h-10"
                          optionFilterProp="label"
                          options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              
              {selectedType === "transfer" ? (
                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> To Account</FormLabel>
                      <FormControl>
                        <Select
                          showSearch
                          placeholder="Select destination"
                          className="w-full h-10"
                          optionFilterProp="label"
                          options={accounts.map(acc => ({ label: acc.name, value: acc._id }))}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* If transfer, date goes on its own row */}
            {selectedType === "transfer" && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Row 4: Dedicated Note Row */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><AlignLeft className="w-4 h-4 text-muted-foreground" /> Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">{transaction ? "Save Changes" : "Save Transaction"}</Button>
          </form>
        </Form>
      </DialogContent>
      <ScanAndPayModal open={scanPayOpen} onOpenChange={(val) => { setScanPayOpen(val); if (!val) setOpen(false); }} />
    </Dialog>
    </>
  );
}
