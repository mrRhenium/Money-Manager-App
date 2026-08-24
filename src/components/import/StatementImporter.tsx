"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, ArrowRight, Check, X, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "antd";
import { bulkInsertTransactions } from "@/actions/bulkImport";
import { useToast } from "@/hooks/useToast";
import { parseToDate } from "@/lib/dateTimeHelper";
import dayjs from "dayjs";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currencyFormatter";
import { useCurrency } from "@/hooks/useCurrency";

export function StatementImporter({ accounts, categories }: { accounts: any[]; categories: any[] }) {
  const { format } = useCurrency();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Mapping state
  const [dateCol, setDateCol] = useState<string>("");
  const [amountCol, setAmountCol] = useState<string>("");
  const [descCol, setDescCol] = useState<string>("");
  const [typeCol, setTypeCol] = useState<string>("");
  
  // Account selected for import
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  // Processed transactions ready for preview
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const downloadTemplate = () => {
    const templateData = [
      {
        Date: "2023-10-25",
        Description: "Supermarket Purchase",
        Amount: 150.50,
        Type: "Expense"
      },
      {
        Date: "2023-10-26",
        Description: "Monthly Salary",
        Amount: 5000,
        Type: "Income"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (data.length > 1) {
          const fileHeaders = data[0].map(h => String(h).trim());
          setHeaders(fileHeaders);
          
          // Convert rows to objects
          const rows = data.slice(1).map(row => {
            const obj: any = {};
            fileHeaders.forEach((h, i) => {
              obj[h] = row[i];
            });
            return obj;
          }).filter(row => Object.keys(row).length > 0 && row[fileHeaders[0]]); // basic empty row filter
          
          setFileData(rows);
          
          // Try to auto-guess columns
          const dateMatch = fileHeaders.find(h => /date/i.test(h));
          const amountMatch = fileHeaders.find(h => /amount|credit|debit|rs/i.test(h));
          const descMatch = fileHeaders.find(h => /desc|narration|particulars|details/i.test(h));
          const typeMatch = fileHeaders.find(h => /type|cr\/dr/i.test(h));
          
          if (dateMatch) setDateCol(dateMatch);
          if (amountMatch) setAmountCol(amountMatch);
          if (descMatch) setDescCol(descMatch);
          if (typeMatch) setTypeCol(typeMatch);
          
          setStep(2);
        } else {
          toast.error("File appears to be empty.");
        }
      } catch (err) {
        toast.error("Error reading file. Ensure it is a valid CSV or Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const processMapping = () => {
    if (!dateCol || !amountCol || !descCol || !selectedAccount) {
      toast.error("Please select all required columns and an account.");
      return;
    }

    const processed = fileData.map((row, index) => {
      const rawAmount = row[amountCol];
      let amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/,/g, ''));
      
      let type = "expense";
      if (typeCol && row[typeCol]) {
        const rawType = String(row[typeCol]).toLowerCase();
        if (rawType.includes("cr") || rawType.includes("credit") || rawType.includes("deposit")) {
          type = "income";
        }
      } else if (amount < 0) {
        type = "expense";
        amount = Math.abs(amount);
      } else if (amount > 0) {
        // Some statements represent income as positive, expense as negative.
        // Others represent both as positive but have a separate column.
        // If there's no type column, we guess based on sign. If all are positive, it's ambiguous.
        // For now, positive means income if no type column is provided.
        type = "income";
      }

      const note = String(row[descCol] || "").substring(0, 100);
      
      // Auto-categorize (Robust word boundary matching)
      let categoryId = "";
      const matchedCat = categories.find(c => {
        if (c.type === type) {
          // Escape special characters in category name for regex, then use word boundaries
          const escapedName = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedName}\\b`, 'i');
          return regex.test(note);
        }
        return false;
      });
      if (matchedCat) {
        categoryId = matchedCat._id;
      }

      // Format date
      let dateStr = row[dateCol];
      if (typeof dateStr === 'number') {
        const dateObj = parseToDate((dateStr - (25567 + 1)) * 86400 * 1000);
        dateStr = dateObj.toISOString().split('T')[0];
      } else if (typeof dateStr === 'string') {
        // Robust dayjs parsing
        const d = dayjs(dateStr);
        if (d.isValid()) {
          dateStr = d.format('YYYY-MM-DD');
        }
      }

      return {
        id: index,
        date: dateStr,
        amount: isNaN(amount) ? 0 : amount,
        type,
        note,
        accountId: selectedAccount,
        categoryId: categoryId,
        selected: !isNaN(amount) && amount > 0 && !!dateStr // Auto-select valid rows
      };
    });

    setTransactions(processed);
    setStep(3);
  };

  const handleCategoryChange = (id: number, catId: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, categoryId: catId } : t));
  };

  const handleToggleSelect = (id: number) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const handleSubmit = async () => {
    const toImport = transactions.filter(t => t.selected).map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      note: t.note,
      accountId: t.accountId,
      categoryId: t.categoryId || undefined
    }));

    if (toImport.length === 0) {
      toast.error("No valid transactions selected to import.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bulkInsertTransactions(toImport);
      toast.success(`Successfully imported ${res.success} transactions.`);
      if (res.failed > 0) {
        toast.error(`Failed to import ${res.failed} transactions.`);
      }
      router.push("/transactions");
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-primary bg-primary/10" : ""}`}>1</div>
          <span>Upload</span>
        </div>
        <div className={`flex-1 h-px bg-border mx-4`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-primary bg-primary/10" : ""}`}>2</div>
          <span>Map Columns</span>
        </div>
        <div className={`flex-1 h-px bg-border mx-4`} />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-primary bg-primary/10" : ""}`}>3</div>
          <span>Review</span>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Bank Statement</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md text-center">
            Supports CSV or Excel files. We will help you map the columns in the next step.
          </p>
          <div className="relative">
            <Input 
              type="file" 
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Button>Select File</Button>
          </div>
          
          <div className="mt-10 text-left max-w-2xl w-full bg-background rounded-lg border p-5 shadow-sm text-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h4 className="font-semibold text-base flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /> Supported Columns</h4>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="w-4 h-4" /> Download Template
              </Button>
            </div>
            <p className="text-muted-foreground mb-3">For best results, ensure your Excel or CSV file includes the following columns:</p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground min-w-24">Date:</span>
                <span>The transaction date (e.g. 2023-10-25, 25/10/2023). <span className="text-red-500">*Required</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground min-w-24">Description:</span>
                <span>Details, payee name, or particulars of the transaction. <span className="text-red-500">*Required</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground min-w-24">Amount:</span>
                <span>The numeric value of the transaction. <span className="text-red-500">*Required</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground min-w-24">Type:</span>
                <span>&quot;Income&quot; (Cr) or &quot;Expense&quot; (Dr). <span className="text-xs text-muted-foreground italic">(Optional - guessed from negative amounts if omitted)</span></span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm">Please map the columns from your uploaded file to the corresponding transaction fields. Select the bank account these transactions belong to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Bank Account <span className="text-red-500">*</span></label>
                <Select
                  className="w-full h-10"
                  placeholder="Select Account"
                  value={selectedAccount || undefined}
                  onChange={setSelectedAccount}
                  options={accounts.map(a => ({ label: a.name, value: a._id }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date Column <span className="text-red-500">*</span></label>
                <Select
                  className="w-full h-10"
                  placeholder="Select Date Column"
                  value={dateCol || undefined}
                  onChange={setDateCol}
                  options={headers.map(h => ({ label: h, value: h }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description / Particulars Column <span className="text-red-500">*</span></label>
                <Select
                  className="w-full h-10"
                  placeholder="Select Description Column"
                  value={descCol || undefined}
                  onChange={setDescCol}
                  options={headers.map(h => ({ label: h, value: h }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount Column <span className="text-red-500">*</span></label>
                <Select
                  className="w-full h-10"
                  placeholder="Select Amount Column"
                  value={amountCol || undefined}
                  onChange={setAmountCol}
                  options={headers.map(h => ({ label: h, value: h }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Type Column (Cr/Dr) <span className="text-muted-foreground text-xs">(Optional)</span></label>
                <Select
                  className="w-full h-10"
                  allowClear
                  placeholder="Select Type Column"
                  value={typeCol || undefined}
                  onChange={setTypeCol}
                  options={headers.map(h => ({ label: h, value: h }))}
                />
                <p className="text-xs text-muted-foreground mt-1">If empty, we will try to guess based on amount sign (Negative = Expense).</p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border">
              <h4 className="font-semibold mb-3">Data Preview (First 3 rows)</h4>
              <div className="space-y-3 overflow-x-auto">
                {fileData.slice(0, 3).map((row, i) => (
                  <div key={i} className="text-xs bg-card border rounded p-3 whitespace-pre-wrap font-mono shadow-sm">
                    {JSON.stringify(row, null, 2)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={processMapping} className="gap-2">Continue <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Found <strong>{transactions.length}</strong> transactions. Select the ones you want to import.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTransactions(transactions.map(t => ({ ...t, selected: true })))}>Select All</Button>
              <Button variant="outline" size="sm" onClick={() => setTransactions(transactions.map(t => ({ ...t, selected: false })))}>Deselect All</Button>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Import</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t) => (
                  <tr key={t.id} className={`${t.selected ? "bg-card" : "bg-muted/20 opacity-75"} hover:bg-muted/30 transition-colors`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={t.selected} 
                        onChange={() => handleToggleSelect(t.id)} 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 min-w-[200px] truncate max-w-[300px]" title={t.note}>{t.note}</td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <Select
                        className="w-full"
                        showSearch
                        allowClear
                        placeholder="Select Category"
                        value={t.categoryId || undefined}
                        onChange={(val) => handleCategoryChange(t.id, val)}
                        filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                        options={categories.filter(c => c.type === t.type).map(c => ({
                          label: c.name,
                          value: c._id
                        }))}
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? "+" : "-"}{format(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(2)}>Back to Mapping</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || transactions.filter(t => t.selected).length === 0}
              className="gap-2"
            >
              <Check className="w-4 h-4" /> Import {transactions.filter(t => t.selected).length} Transactions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
