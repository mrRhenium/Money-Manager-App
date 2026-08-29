"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Tag } from "antd";
import { 
  User, 
  Phone, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Star, 
  Calendar, 
  Wallet, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { getPersonTransactions, toggleFavoritePerson } from "@/actions/person";
import { formatDate } from "@/lib/helpers";
import { useToast } from "@/hooks/useToast";
import { TransactionForm } from "@/components/forms/TransactionForm";

interface PersonDetailDrawerProps {
  person: any | null;
  isOpen: boolean;
  onClose: () => void;
  onPersonUpdated?: () => void;
  accounts?: any[];
  categories?: any[];
  creditCards?: any[];
}

export function PersonDetailDrawer({
  person,
  isOpen,
  onClose,
  onPersonUpdated,
  accounts = [],
  categories = [],
  creditCards = []
}: PersonDetailDrawerProps) {
  const { format } = useCurrency();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(person?.isFavorite || false);
  const [filterType, setFilterType] = useState<"all" | "given" | "received">("all");

  useEffect(() => {
    if (person) {
      setIsFavorite(person.isFavorite || false);
      loadTransactions(person._id);
    }
  }, [person]);

  const loadTransactions = async (personId: string) => {
    setLoading(true);
    try {
      const data = await getPersonTransactions(personId);
      setTransactions(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions for this contact");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!person?._id) return;
    try {
      const res = await toggleFavoritePerson(person._id);
      setIsFavorite(res.isFavorite);
      toast.success(res.isFavorite ? `${person.name} marked as Favorite ⭐` : `${person.name} removed from Favorites`);
      if (onPersonUpdated) onPersonUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to update favorite status");
    }
  };

  if (!person) return null;

  // Compute metrics
  const completedTxs = transactions.filter(t => !t.status || t.status === "completed");
  
  // Total money we gave / lent / spent on them
  const totalGiven = completedTxs
    .filter(t => t.type === "lend" || t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Total money we received / borrowed from them
  const totalReceived = completedTxs
    .filter(t => t.type === "borrow" || t.type === "income" || t.type === "settlement")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = person.netBalance !== undefined ? person.netBalance : (totalGiven - totalReceived);

  // Filtered transactions for the view
  const displayTransactions = completedTxs.filter(t => {
    if (filterType === "given") return t.type === "lend" || t.type === "expense";
    if (filterType === "received") return t.type === "borrow" || t.type === "income" || t.type === "settlement";
    return true;
  });

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      placement="right"
      width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 540}
      title={
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground">Contact Statement & Ledger</span>
          </div>
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-semibold ${
              isFavorite 
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" 
                : "text-muted-foreground hover:bg-muted"
            }`}
            title={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
          >
            <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
            {isFavorite ? "Favorited" : "Favorite"}
          </button>
        </div>
      }
      classNames={{
        body: "bg-background text-foreground p-0 custom-scrollbar",
        header: "bg-card text-foreground border-b border-border/50",
        content: "bg-background text-foreground"
      }}
    >
      <div className="flex flex-col h-full">
        {/* Profile Card Header */}
        <div className="p-6 bg-gradient-to-b from-card via-card to-background border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 shadow-md border"
                style={{ 
                  backgroundColor: `${person.color || '#0ea5e9'}20`, 
                  borderColor: `${person.color || '#0ea5e9'}40`,
                  color: person.color || '#0ea5e9' 
                }}
              >
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-foreground truncate">{person.name}</h2>
                  {isFavorite && <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/80 text-secondary-foreground border border-border/50">
                    {person.relation || "Contact"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <TransactionForm 
              accounts={accounts} 
              categories={categories} 
              people={[person]} 
              creditCards={creditCards}
              transaction={{ personId: person._id }}
              triggerClassName="h-9 px-3 text-xs font-semibold"
            />
          </div>

          {/* Contact Details (Phones & VPAs) */}
          {((person.phones && person.phones.length > 0) || (person.vpas && person.vpas.length > 0)) && (
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-2 text-xs">
              {person.phones?.map((p: string, i: number) => (
                <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/40">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>{p}</span>
                </div>
              ))}
              {person.vpas?.map((v: string, i: number) => (
                <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 font-mono">
                  <QrCode className="w-3 h-3 text-primary" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financial KPI Summary Cards */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Total Money Given / Lent */}
            <div className="p-3.5 rounded-xl border bg-card/80 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Total Given (Out)</span>
                <ArrowUpRight className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-lg font-extrabold text-foreground mt-1">
                <CurrencyDisplay amount={totalGiven} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">Lent / Paid</span>
            </div>

            {/* Total Money Received / Borrowed */}
            <div className="p-3.5 rounded-xl border bg-card/80 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Total Received (In)</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                <CurrencyDisplay amount={totalReceived} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">Received / Repaid</span>
            </div>
          </div>

          {/* Net Balance Banner */}
          <div className="mt-3 p-4 rounded-xl border bg-card shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                netBalance > 0 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : netBalance < 0 
                    ? 'bg-red-500/15 text-red-500' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {netBalance > 0 ? <ArrowDownLeft className="w-5 h-5" /> : netBalance < 0 ? <ArrowUpRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Current Net Position</p>
                <p className={`text-base font-extrabold ${
                  netBalance > 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : netBalance < 0 
                      ? 'text-red-500' 
                      : 'text-muted-foreground'
                }`}>
                  {netBalance > 0 
                    ? `You will receive ${format(netBalance)}` 
                    : netBalance < 0 
                      ? `You owe / To Pay ${format(Math.abs(netBalance))}` 
                      : 'All Settled (₹0)'}
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              netBalance > 0 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : netBalance < 0 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                  : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
            }`}>
              {netBalance > 0 ? "They Owe" : netBalance < 0 ? "You Owe" : "Settled"}
            </span>
          </div>
        </div>

        {/* Transaction History Statement */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Full Transaction History ({displayTransactions.length})
            </h3>

            {/* Filter Pills */}
            <div className="flex gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/40 text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${filterType === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("given")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${filterType === "given" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
              >
                Given
              </button>
              <button
                onClick={() => setFilterType("received")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${filterType === "received" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"}`}
              >
                Received
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs">Loading complete statement...</p>
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border rounded-2xl border-dashed">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">No transactions recorded yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use "+ Record Transaction" above to add money given or received.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayTransactions.map((tx: any) => {
                const isIncoming = tx.type === "income" || tx.type === "borrow" || tx.type === "settlement";
                const isLend = tx.type === "lend";
                const isBorrow = tx.type === "borrow";
                const isSettlement = tx.type === "settlement";

                let typeLabel = "Payment";
                if (isLend) typeLabel = "Money Lent (You gave)";
                else if (isBorrow) typeLabel = "Money Borrowed (You took)";
                else if (isSettlement) typeLabel = "Settlement / Repayment";
                else if (tx.type === "income") typeLabel = "Income / Gift";
                else if (tx.type === "expense") typeLabel = "Expense / Paid";

                return (
                  <div 
                    key={tx._id}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isIncoming ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />

                    <div className="flex items-start justify-between pl-1">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {typeLabel}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isIncoming 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {isIncoming ? "Received" : "Paid / Lent"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(tx.date, "short")}</span>
                          {tx.accountId?.name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {tx.accountId.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <CurrencyDisplay 
                          amount={isIncoming ? tx.amount : -tx.amount} 
                          className={`text-base font-extrabold ${isIncoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                          showSign={true}
                        />
                      </div>
                    </div>

                    {tx.note && (
                      <div className="pl-1 pt-1.5 border-t border-border/40 text-xs text-muted-foreground italic flex items-center gap-1.5">
                        <FileText className="w-3 h-3 shrink-0 not-italic text-primary" />
                        <span className="truncate">{tx.note}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
