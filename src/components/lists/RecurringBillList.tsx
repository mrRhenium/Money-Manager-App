"use client";

import { useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { Repeat, Edit2, Trash, Smartphone, Wallet, CheckCircle, Search } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RecurringBillForm } from "@/components/forms/RecurringBillForm";
import { deleteRecurringBill } from "@/actions/recurringBill";
import { useToast } from "@/hooks/useToast";
import { Popconfirm } from "antd";
import { formatDateString } from "@/lib/dateTimeHelper";

interface RecurringBillListProps {
  bills: any[];
  accounts: any[];
  categories: any[];
}

export function RecurringBillList({ bills, accounts, categories }: RecurringBillListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { format } = useCurrency();

  const filteredBills = bills.filter(bill => 
    bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.autoPayPlatform && bill.autoPayPlatform.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringBill(id);
      toast.success("Subscription deleted");
    } catch (error) {
      toast.error("Failed to delete subscription");
    }
  };

  return (
    <div className="space-y-4">
      {bills.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl shadow-sm border border-border/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search subscriptions..." 
              className="pl-9 h-10 bg-secondary/50 border-secondary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBills.map((bill, index) => {
          const dueDate = new Date(bill.nextDueDate);
          const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();
          const isToday = dueDate.toDateString() === new Date().toDateString();

          return (
            <div key={bill._id} className="relative group block rounded-2xl p-5 border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden gap-4">
              <div className="flex justify-between items-start gap-4 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground shrink-0">{index + 1}.</span>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner" 
                    style={{ backgroundColor: bill.color || '#6366f1' }}
                  >
                    <CategoryIcon name={bill.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight line-clamp-1" title={bill.name}>{bill.name}</h3>
                    <p className="text-sm font-semibold mt-1">
                      {format(bill.amount)} <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-normal">/ {bill.frequency}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 transition-opacity shrink-0">
                  <RecurringBillForm accounts={accounts} categories={categories} bill={bill} />
                  <Popconfirm
                    title="Delete Subscription"
                    description="Are you sure you want to delete this subscription?"
                    onConfirm={() => handleDelete(bill._id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors cursor-pointer">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>

              <div className="z-10 mt-auto">
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"><Wallet className="w-3 h-3" /> FROM</span>
                    <span className="font-semibold truncate max-w-[120px]">{bill.accountId?.name || "Not set"}</span>
                  </div>
                  {bill.autoPayPlatform && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> PLATFORM</span>
                      <span className="font-semibold truncate max-w-[120px]">{bill.autoPayPlatform}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Badge variant={isOverdue ? "destructive" : isToday ? "default" : "secondary"} className="font-bold px-3 py-1">
                    {isOverdue ? "Overdue" : isToday ? "Due Today" : `Due: ${formatDateString(dueDate, "DD-MM-YYYY")}`}
                  </Badge>
                  
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-full hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" onClick={() => {
                    toast.info("In a future update, this will automatically log the payment and advance the due date!");
                  }}>
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Paid
                  </Button>
                </div>
              </div>

              {/* Decorative background circle */}
              <div 
                className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                style={{ backgroundColor: bill.color || '#6366f1' }}
              />
            </div>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{bills.length === 0 ? "No Subscriptions Found" : "No Results"}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">{bills.length === 0 ? "You haven\u0027t set up any recurring bills, auto-pays, or allowances yet." : "No subscriptions match your search."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
