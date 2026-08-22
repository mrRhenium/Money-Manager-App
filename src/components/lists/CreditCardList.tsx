"use client";

import { List, Popconfirm, Modal } from "antd";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCardForm } from "../forms/CreditCardForm";
import { deleteCreditCard } from "@/actions/creditCard";
import { useCurrency } from "@/hooks/useCurrency";

export function CreditCardList({ cards }: { cards: any[] }) {
  const { format } = useCurrency();
  if (cards.length === 0) {
    return null; // The parent page handles empty state beautifully
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 3 }}
        dataSource={cards}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(card: any, index: number) => {
          const utilization = (card.currentOutstanding / card.creditLimit) * 100;
          const isHighUtilization = utilization > 70;

          return (
            <List.Item>
              <Link href={`/credit-cards/${card._id}`} className="group relative block cursor-pointer transition-transform hover:-translate-y-1 h-full">
                <div 
                  className="rounded-2xl p-6 text-white shadow-lg overflow-hidden h-56 flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${card.color} 0%, #1a1a1a 150%)` }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-white/70 font-bold shrink-0 text-sm mt-1">{index + 1}.</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg opacity-90 truncate" title={card.bankName}>{card.bankName}</h3>
                        <p className="text-sm opacity-80 truncate" title={card.cardName}>{card.cardName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 z-10 shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <CreditCardForm card={card} />
                      <Popconfirm
                        title="Delete Credit Card"
                        description="Are you sure you want to delete this credit card?"
                        onConfirm={async () => {
                          try {
                            const res = await deleteCreditCard(card._id);
                            if (res && !res.success) {
                              Modal.error({
                                title: "Cannot Delete Credit Card",
                                content: res.error || "This credit card has outstanding balance or other issues.",
                                okText: "Close",
                              });
                            }
                          } catch (err: any) {
                            Modal.error({
                              title: "Cannot Delete Credit Card",
                              content: err.message || "This credit card has outstanding balance or other issues.",
                              okText: "Close",
                            });
                          }
                        }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </Popconfirm>
                      <div className="bg-white/25 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                        {card.cardNetwork}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 font-mono text-base sm:text-lg md:text-xl tracking-widest mb-4 opacity-90">
                      <span>••••</span>
                      <span>••••</span>
                      <span>••••</span>
                      <span>{card.last4Digits}</span>
                    </div>

                    <div className="flex justify-between items-end text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground opacity-80 mb-0.5">Outstanding</p>
                        <p className="font-bold">{format(card.currentOutstanding)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground opacity-80 mb-0.5">Available Limit</p>
                        <p className="font-bold">{format(card.availableLimit)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-secondary/30 rounded-xl p-3 transition-colors group-hover:bg-secondary/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-medium">Utilization</span>
                    <span className={isHighUtilization ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{utilization.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(utilization, 100)} 
                    className="h-2" 
                    indicatorColor={isHighUtilization ? "#ef4444" : "#10b981"} 
                  />
                  
                  {isHighUtilization && (
                    <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" /> High utilization affects credit score
                    </p>
                  )}
                </div>
              </Link>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
