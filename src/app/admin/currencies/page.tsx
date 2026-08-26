import { getAllCurrencies } from "@/actions/currency";
import { CurrencyForm } from "@/components/admin/CurrencyForm";
import { CurrencyDeleteButton } from "@/components/admin/CurrencyDeleteButton";
import { CurrencySyncButton } from "@/components/admin/CurrencySyncButton";
import { AdminCurrenciesClient } from "./AdminCurrenciesClient";
import { MasterLayout, MasterContent } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { Banknote } from "lucide-react";

export default async function AdminCurrenciesPage() {
  const currencies = await getAllCurrencies(false);

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Banknote className="w-6 h-6 text-primary" /> Currencies</>}
        subtitle="Manage system currencies and exchange rates."
        actions={
          <div className="flex items-center gap-2">
            <CurrencySyncButton />
            <CurrencyForm />
          </div>
        }
      />
      <MasterContent>
        <AdminCurrenciesClient currencies={currencies} />
      </MasterContent>
    </MasterLayout>
  );
}
