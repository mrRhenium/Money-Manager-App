"use client";

import { List, Popconfirm, Modal } from "antd";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Trash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { CreditCardForm } from "../forms/CreditCardForm";
import { CreditCardDeleteModal } from "../forms/CreditCardDeleteModal";
import { useCurrency } from "@/hooks/useCurrency";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

export function CreditCardList({ cards, hideToolbar = false, externalSort }: { cards: any[], hideToolbar?: boolean, externalSort?: string }) {
  const { format } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = useMemo(() => {
    let result = [...cards];

    if (!hideToolbar) {
      result = result.filter(card => {
        return card.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               card.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               card.last4Digits.includes(searchQuery);
      });
    }

    if (externalSort) {
      result.sort((a, b) => {
        if (externalSort === "limit-high") return b.creditLimit - a.creditLimit;
        if (externalSort === "limit-low") return a.creditLimit - b.creditLimit;
        if (externalSort === "used-high") return b.currentOutstanding - a.currentOutstanding;
        if (externalSort === "used-low") return a.currentOutstanding - b.currentOutstanding;
        if (externalSort === "bank-asc") return a.bankName.localeCompare(b.bankName);
        if (externalSort === "bank-desc") return b.bankName.localeCompare(a.bankName);
        return 0;
      });
    }

    return result;
  }, [cards, searchQuery, hideToolbar, externalSort]);

  if (cards.length === 0) {
    return null; // The parent page handles empty state beautifully
  }

  return (
    <div className="w-full space-y-4">
      {!hideToolbar && (
        <div className="flex bg-card p-3 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search credit cards by bank, name, or last 4 digits..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {filteredCards.length === 0 && (
        <div className="p-8 text-center border rounded-xl border-dashed">
          <p className="text-muted-foreground">No credit cards match your search.</p>
        </div>
      )}

      {filteredCards.length > 0 && (
        <List
          grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 3 }}
          dataSource={filteredCards}
          pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(card: any, index: number) => {
          const utilization = (card.currentOutstanding / card.creditLimit) * 100;
          const isHighUtilization = utilization > 70;

          return (
            <List.Item>
              <div className="group relative block rounded-2xl transition-transform hover:-translate-y-1 h-full">
                <div 
                  className="rounded-2xl p-6 text-white shadow-lg overflow-hidden h-56 flex flex-col justify-between relative"
                  style={{ background: `linear-gradient(135deg, ${card.color} 0%, #1a1a1a 150%)` }}
                >
                  <Link href={`/credit-cards/${card._id}`} className="absolute inset-0 z-0" aria-label={`View details of ${card.bankName} ${card.cardName}`} />

                  <div className="flex justify-between items-start gap-2 relative z-10 pointer-events-none">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={cn(TYPOGRAPHY.cardLabel, "text-white/70 font-bold shrink-0 mt-1")}>{index + 1}.</span>
                      <div className="min-w-0">
                        <h3 className={cn(TYPOGRAPHY.cardTitle, "leading-none mb-1 opacity-90 text-white")} title={card.bankName}>{card.bankName}</h3>
                        <p className={cn(TYPOGRAPHY.cardSubtitle, "opacity-80 text-white/80")} title={card.cardName}>{card.cardName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className={cn(TYPOGRAPHY.badge, "bg-white/25 text-white backdrop-blur-md mt-1")}>
                        {card.cardNetwork}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <Link href={`/credit-cards/${card._id}`} className="flex items-center gap-2 sm:gap-3 md:gap-4 font-mono text-base sm:text-lg md:text-xl tracking-widest opacity-90 hover:opacity-100 transition-opacity">
                      <span>••••</span>
                      <span>••••</span>
                      <span>••••</span>
                      <span>{card.last4Digits}</span>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <CreditCardForm card={card} />
                      <CreditCardDeleteModal card={card} transactionsCount={card.transactionsCount || 0} />
                    </div>
                  </div>
                </div>

                <Link href={`/credit-cards/${card._id}`} className="block mt-3 bg-secondary/30 rounded-xl p-3 transition-colors group-hover:bg-secondary/50 w-full space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={cn(TYPOGRAPHY.cardLabel, "mb-1")}>Used / Limit</p>
                      <p className={cn(TYPOGRAPHY.cardValue, "font-semibold")}>
                        {format(card.currentOutstanding)} <span className="text-muted-foreground font-normal">/ {format(card.creditLimit)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-1">
                        <p className={cn(TYPOGRAPHY.cardLabel)}>Available</p>
                        <span className={cn(TYPOGRAPHY.badge, "px-1.5 py-0", isHighUtilization ? "text-red-500 bg-red-500/10 font-bold" : "text-emerald-600 bg-emerald-500/10 font-bold")}>{utilization.toFixed(1)}%</span>
                      </div>
                      <p className={cn(TYPOGRAPHY.cardValue, "font-semibold text-right")}>
                        {format(card.availableLimit)}
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(utilization, 100)} 
                    className="h-3" 
                    indicatorColor={isHighUtilization ? "#ef4444" : "#10b981"} 
                  />
                  
                  {isHighUtilization && (
                    <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> High utilization affects credit score
                    </p>
                  )}
                </Link>
              </div>
            </List.Item>
          );
        }}
      />
      )}
    </div>
  );
}
