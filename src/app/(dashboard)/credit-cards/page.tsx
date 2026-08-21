import { getCreditCards } from "@/actions/creditCard";
import { CreditCardForm } from "@/components/forms/CreditCardForm";
import { CreditCard as CardIcon, CreditCard, AlertCircle } from "lucide-react";
import { CreditCardList } from "@/components/lists/CreditCardList";

export default async function CreditCardsPage() {
  const cards = await getCreditCards();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CardIcon className="w-8 h-8 text-primary" />
            Credit Cards
          </h1>
          <p className="text-muted-foreground mt-1">Manage your credit cards, statements, and bills.</p>
        </div>
        <CreditCardForm />
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Credit Cards Yet</h3>
          <p className="text-muted-foreground mb-6">Register your first credit card to start tracking bills.</p>
          <CreditCardForm />
        </div>
      ) : (
        <CreditCardList cards={cards} />
      )}
    </div>
  );
}
