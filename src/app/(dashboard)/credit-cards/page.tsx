import { getCreditCards } from "@/actions/creditCard";
import { CreditCardForm } from "@/components/forms/CreditCardForm";
import { CreditCard as CardIcon, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card: any) => {
            const utilization = (card.currentOutstanding / card.creditLimit) * 100;
            const isHighUtilization = utilization > 70;

            return (
              <Link key={card._id} href={`/credit-cards/${card._id}`} className="group relative block cursor-pointer transition-transform hover:-translate-y-1">
                <div 
                  className="rounded-2xl p-6 text-white shadow-lg overflow-hidden h-56 flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${card.color} 0%, #1a1a1a 150%)` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg opacity-90">{card.bankName}</h3>
                      <p className="text-sm opacity-80">{card.cardName}</p>
                    </div>
                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-semibold uppercase backdrop-blur-md">
                      {card.cardNetwork}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 font-mono text-xl tracking-[0.2em] mb-4 opacity-90">
                      <span>••••</span>
                      <span>••••</span>
                      <span>••••</span>
                      <span>{card.last4Digits}</span>
                    </div>

                    <div className="flex justify-between items-end text-sm">
                      <div>
                        <p className="opacity-70 text-xs">Outstanding</p>
                        <p className="font-bold">₹{card.currentOutstanding.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="opacity-70 text-xs">Available</p>
                        <p className="font-bold">₹{card.availableLimit.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 px-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilization</span>
                    <span className={isHighUtilization ? "text-red-500 font-bold" : ""}>{utilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={utilization} className={`h-2 ${isHighUtilization ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`} />
                  
                  {isHighUtilization && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> High utilization affects credit score
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
