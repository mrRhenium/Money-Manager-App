"use client";

import { List, Popconfirm } from "antd";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCardForm } from "../forms/CreditCardForm";
import { deleteCreditCard } from "@/actions/creditCard";

export function CreditCardList({ cards }: { cards: any[] }) {
  if (cards.length === 0) {
    return null; // The parent page handles empty state beautifully
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
        dataSource={cards}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(card: any) => {
          const utilization = (card.currentOutstanding / card.creditLimit) * 100;
          const isHighUtilization = utilization > 70;

          return (
            <List.Item>
              <Link href={`/credit-cards/${card._id}`} className="group relative block cursor-pointer transition-transform hover:-translate-y-1 h-full">
                <div 
                  className="rounded-2xl p-6 text-white shadow-lg overflow-hidden h-56 flex flex-col justify-between"
                  style={{ background: `linear-gradient(135deg, ${card.color} 0%, #1a1a1a 150%)` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg opacity-90">{card.bankName}</h3>
                      <p className="text-sm opacity-80">{card.cardName}</p>
                    </div>
                    <div className="flex items-center gap-1 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <CreditCardForm card={card} />
                      <Popconfirm
                        title="Delete Credit Card"
                        description="Are you sure you want to delete this credit card?"
                        onConfirm={() => deleteCreditCard(card._id)}
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
            </List.Item>
          );
        }}
      />
    </div>
  );
}
