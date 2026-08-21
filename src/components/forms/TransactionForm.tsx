"use client";

import { useState } from "react";
import { getCurrentFormatted } from "@/lib/dateTimeHelper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "antd";
import { createTransaction } from "@/actions/transaction";
import { useRef } from "react";
import Tesseract from "tesseract.js";
import { Camera, Loader2, Plus, Tags, Banknote, Coins, Landmark, Folder, Calendar, AlignLeft, ReceiptText } from "lucide-react";

const formSchema = z.object({
  type: z.enum(["income", "expense", "lend", "borrow", "settlement"]),
  amount: z.coerce.number().positive(),
  originalCurrency: z.string().default("INR"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  note: z.string().optional(),
  date: z.string(),
});

interface TransactionFormProps {
  accounts: any[];
  categories: any[];
}

export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "expense",
      amount: 0,
      originalCurrency: "INR",
      accountId: accounts.length > 0 ? accounts[0]._id : "",
      categoryId: "",
      note: "",
      date: getCurrentFormatted("YYYY-MM-DDTHH:mm"),
    },
  });

  const selectedType = form.watch("type");
  const filteredCategories = categories.filter(c => c.type === selectedType || selectedType === "lend" || selectedType === "borrow" || selectedType === "settlement");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      
      // Simple Regex to find amounts (e.g. Total: 15.99, $24.00, Rs. 150)
      const amountMatches = text.match(/(?:total|amount|pay|paid|rs\.?|\$|₹)\s*:?\s*(\d+[\.,]\d{2})/i) 
                            || text.match(/(\d+\.\d{2})/g);
      
      if (amountMatches && amountMatches.length > 0) {
        // Find the largest number assuming it's the total
        const numbers = (text.match(/\d+\.\d{2}/g) || []).map(Number);
        const maxAmount = numbers.length > 0 ? Math.max(...numbers) : 0;
        
        if (maxAmount > 0) {
          form.setValue("amount", maxAmount);
          form.setValue("note", "Scanned from receipt");
        }
      }
    } catch (err) {
      console.error("Scanning failed", err);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createTransaction({
        ...values,
        categoryId: values.categoryId || undefined,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create transaction", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      } />
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ReceiptText className="w-5 h-5" />
            <span className="text-foreground">Log Transaction</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Smart Scan</h4>
              <p className="text-xs text-muted-foreground">Upload a receipt to auto-fill the amount</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
            {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
            {isScanning ? "Scanning..." : "Upload Receipt"}
          </Button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                          }}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="originalCurrency"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="flex items-center gap-2"><Coins className="w-4 h-4 text-muted-foreground" /> Currency</FormLabel>
                      <FormControl>
                        <Select
                          showSearch
                          className="w-full h-10"
                          optionFilterProp="label"
                          options={[
                            { label: 'INR', value: 'INR' },
                            { label: 'USD', value: 'USD' },
                            { label: 'EUR', value: 'EUR' },
                            { label: 'GBP', value: 'GBP' },
                          ]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Landmark className="w-4 h-4 text-muted-foreground" /> Account</FormLabel>
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

            {(selectedType === "expense" || selectedType === "income") && (
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
            )}

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Button type="submit" className="w-full">Save Transaction</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
