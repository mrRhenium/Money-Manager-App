"use client";

import { useState } from "react";
import { formatIndianNumber } from "@/lib/numberHelper";
import { Repeat, Edit2, Trash, Smartphone, Wallet, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RecurringBillForm } from "@/components/forms/RecurringBillForm";
import { deleteRecurringBill } from "@/actions/recurringBill";
import { useToast } from "@/hooks/useToast";
import { Popconfirm } from "antd";

interface RecurringBillListProps {
  bills: any[];
  accounts: any[];
  categories: any[];
}

export function RecurringBillList({ bills, accounts, categories }: RecurringBillListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

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
        <RecurringBillForm accounts={accounts} categories={categories} triggerClassName="w-full sm:w-auto h-10 shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map((bill) => {
          const dueDate = new Date(bill.nextDueDate);
          const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();
          const isToday = dueDate.toDateString() === new Date().toDateString();

          return (
            <div key={bill._id} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{bill.name}</h3>
                    <p className="text-sm font-medium text-foreground">₹{formatIndianNumber(bill.amount)} <span className="text-muted-foreground text-xs font-normal">/ {bill.frequency}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <RecurringBillForm accounts={accounts} categories={categories} bill={bill} />
                  <Popconfirm
                    title="Delete Subscription"
                    description="Are you sure you want to delete this subscription?"
                    onConfirm={() => handleDelete(bill._id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors cursor-pointer">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> From</span>
                  <span className="font-medium truncate max-w-[120px]">{bill.accountId?.name || "Not set"}</span>
                </div>
                {bill.autoPayPlatform && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Platform</span>
                    <span className="font-medium truncate max-w-[120px]">{bill.autoPayPlatform}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge variant={isOverdue ? "destructive" : isToday ? "default" : "secondary"} className="font-medium">
                  {isOverdue ? "Overdue" : isToday ? "Due Today" : `Due: ${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </Badge>
                
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-full" onClick={() => {
                  // In the future, this could pre-fill a TransactionForm and increment the nextDueDate
                  window.alert("In a future update, this will automatically log the payment and advance the due date!");
                }}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Paid
                </Button>
              </div>
            </div>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Subscriptions Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">You haven&apos;t set up any recurring bills, auto-pays, or allowances yet.</p>
            <RecurringBillForm accounts={accounts} categories={categories} />
          </div>
        )}
      </div>
    </div>
  );
}
