import { getAllCurrencies } from "@/actions/currency";
import { CurrencyForm } from "@/components/admin/CurrencyForm";
import { CurrencyDeleteButton } from "@/components/admin/CurrencyDeleteButton";
import { CurrencySyncButton } from "@/components/admin/CurrencySyncButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminCurrenciesPage() {
  const currencies = await getAllCurrencies(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground">Manage system currencies and exchange rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencySyncButton />
          <CurrencyForm />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Exchange Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No currencies found.
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((currency: any) => (
                <TableRow key={currency._id}>
                  <TableCell>
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-sm text-muted-foreground">{currency.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-bold">{currency.symbol}</div>
                  </TableCell>
                  <TableCell>
                    {currency.isBase ? (
                      <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-none">Base Currency</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium font-mono">{currency.exchangeRate}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={currency.isActive ? "outline" : "secondary"} className={currency.isActive ? "border-green-500 text-green-600" : ""}>
                      {currency.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <CurrencyForm currency={currency} />
                      <CurrencyDeleteButton id={currency._id} isBase={currency.isBase} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
