"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Shield, TrendingUp, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function UpcomingDuesWidget({ dues }: { dues: any[] }) {
  const { format } = useCurrency();
  if (!dues || dues.length === 0) return null;

  return (
    <Card className="border-none bg-card shadow-sm mt-8">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Dues
          </CardTitle>
          <Badge variant="outline" className="text-xs font-normal">Next 30 Days</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 p-0">
        <div className="divide-y divide-border/50">
          {dues.map((due: any, idx: number) => {
            const isOverdue = new Date(due.dueDate) < new Date();
            
            let Icon = Calendar;
            let iconColor = "text-muted-foreground";
            
            if (due.type === "credit_card") { Icon = CreditCard; iconColor = "text-blue-500"; }
            if (due.type === "insurance") { Icon = Shield; iconColor = "text-emerald-500"; }
            if (due.type === "sip") { Icon = TrendingUp; iconColor = "text-purple-500"; }
            if (due.type === "subscription") { Icon = RefreshCw; iconColor = "text-amber-500"; }
            
            return (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-secondary shrink-0 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{due.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span className={isOverdue ? "text-destructive font-medium" : ""}>
                        Due: {new Date(due.dueDate).toLocaleDateString()}
                      </span>
                      {isOverdue && <AlertCircle className="w-3 h-3 text-destructive" />}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-sm">{format(due.amount)}</div>
                    <div className="text-xs text-muted-foreground uppercase">{due.type}</div>
                  </div>
                  <Button size="sm" variant={isOverdue ? "destructive" : "secondary"} className="h-8 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Pay
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
