"use client";

import { useState, useMemo } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { Repeat, Edit2, Smartphone, Wallet, CheckCircle, Search, ArrowUpDown, Loader2, Calendar, Clock } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RecurringBillForm } from "@/components/forms/RecurringBillForm";
import { RecurringBillDeleteModal } from "@/components/forms/RecurringBillDeleteModal";
import { markSubscriptionPaid } from "@/actions/recurringBill";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { Tabs, Select as AntSelect, List } from "antd";
import { formatDateString, parseToDate, getStartOfDay } from "@/lib/dateTimeHelper";
import { SubscriptionHistoryModal } from "@/components/forms/SubscriptionHistoryModal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { TYPOGRAPHY } from "@/lib/designTokens";
import { cn } from "@/lib/utils";

interface RecurringBillListProps {
  bills: any[];
  accounts: any[];
  categories: any[];
  hideToolbar?: boolean;
  externalSort?: string;
  externalSearch?: string;
  externalTab?: string;
}

export function RecurringBillList({ 
  bills, 
  accounts, 
  categories, 
  hideToolbar = false,
  externalSort = "",
  externalSearch = "",
  externalTab = "1"
}: RecurringBillListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("1");
  const [sortBy, setSortBy] = useState("date-nearest");
  const [payingId, setPayingId] = useState<string | null>(null);
  const router = useRouter();
  
  const { toast } = useToast();
  const { format } = useCurrency();

  const activeBills = bills.filter(b => b.isActive);
  const pausedBills = bills.filter(b => !b.isActive);

  const displayedBills = useMemo(() => {
    const currentTab = hideToolbar ? externalTab : activeTab;
    const currentSearch = hideToolbar ? externalSearch : searchTerm;
    const currentSort = hideToolbar ? externalSort : sortBy;

    let list = currentTab === "1" ? activeBills : currentTab === "2" ? pausedBills : currentTab === "3" ? activeBills.filter(b => {
      const dueDate = new Date(b.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate.getTime() < today.getTime();
    }) : activeBills;

    // Filter
    if (currentSearch) {
      list = list.filter(bill => 
        bill.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
        (bill.autoPayPlatform && bill.autoPayPlatform.toLowerCase().includes(currentSearch.toLowerCase()))
      );
    }

    // Sort
    return list.sort((a, b) => {
      if (currentSort === "date-nearest") return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      if (currentSort === "date-farthest") return new Date(b.nextDueDate).getTime() - new Date(a.nextDueDate).getTime();
      if (currentSort === "amount-high") return b.amount - a.amount;
      if (currentSort === "amount-low") return a.amount - b.amount;
      return 0;
    });
  }, [activeBills, pausedBills, activeTab, searchTerm, sortBy, hideToolbar, externalTab, externalSearch, externalSort]);

  const [variablePayBill, setVariablePayBill] = useState<any>(null);
  const [variableAmount, setVariableAmount] = useState("");

  const handleMarkPaid = async (bill: any) => {
    if (bill.isFixedAmount === false) {
      setVariablePayBill(bill);
      setVariableAmount(formatIndianNumber(bill.amount));
      return;
    }

    setPayingId(bill._id);
    try {
      const res = await markSubscriptionPaid(bill._id);
      if (res && !res.success) {
        toast.error(res.error || "Failed to mark paid");
      } else {
        toast.success("Payment recorded and due date advanced!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark paid");
    } finally {
      setPayingId(null);
    }
  };

  const confirmVariablePay = async () => {
    if (!variablePayBill) return;
    const amount = parseIndianNumber(variableAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount");
    
    setPayingId(variablePayBill._id);
    try {
      const res = await markSubscriptionPaid(variablePayBill._id, amount);
      if (res && !res.success) {
        toast.error(res.error || "Failed to mark paid");
      } else {
        toast.success("Payment recorded and due date advanced!");
        setVariablePayBill(null);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark paid");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Variable Pay Dialog */}
      <Dialog open={!!variablePayBill} onOpenChange={(open) => !open && setVariablePayBill(null)}>
        <DialogContent initialFocus={false} size="sm">
          <DialogHeader>
            <DialogTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span>Enter Paid Amount</span>
            </DialogTitle>
            <DialogDescription>
              {variablePayBill?.name} is a variable bill. Confirm the actual amount paid for this cycle.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <CurrencyInput
              currency="INR"
              placeholder="0"
              value={variableAmount}
              onChange={(e) => setVariableAmount(formatIndianNumber(e.target.value))}
              onCurrencyChange={() => {}}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" className="h-10 px-4 text-sm w-full sm:w-auto" onClick={() => setVariablePayBill(null)}>Cancel</Button>
            <Button className="h-10 px-5 text-sm font-semibold shadow-md w-full sm:w-auto" onClick={confirmVariablePay} disabled={payingId === variablePayBill?._id}>
              {payingId === variablePayBill?._id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!hideToolbar && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-card p-3 rounded-xl border shadow-sm items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search subscriptions by name or platform..." 
                className="pl-9 bg-background h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 w-full">
              <AntSelect
                value={sortBy}
                onChange={setSortBy}
                className="w-full h-10"
                suffixIcon={<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />}
                options={[
                  { label: "🔥 Due: Nearest First", value: "date-nearest" },
                  { label: "🕐 Due: Farthest First", value: "date-farthest" },
                  { label: "📈 Amount: High to Low", value: "amount-high" },
                  { label: "📉 Amount: Low to High", value: "amount-low" },
                ]}
              />
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="budget-tabs"
            items={[
              {
                key: "1",
                label: <span className="px-4 py-1 font-semibold">Active ({activeBills.length})</span>,
              },
              {
                key: "2",
                label: <span className="px-4 py-1 font-semibold text-muted-foreground">Paused ({pausedBills.length})</span>,
              }
            ]}
          />
        </>
      )}

      {displayedBills.length === 0 && (
        <div className="col-span-full py-12 text-center bg-card rounded-2xl border border-dashed">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Subscriptions Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {searchTerm ? "No subscriptions match your search." : `You don't have any ${activeTab === "1" ? "active" : "paused"} subscriptions.`}
          </p>
        </div>
      )}

      {displayedBills.length > 0 && (
        <div className="pt-2 pb-4">
          <List
            grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={displayedBills}
            pagination={{ pageSize: 9, position: "bottom", align: "end" }}
            renderItem={(bill: any, index: number) => {
              const dueDate = parseToDate(bill.nextDueDate);
              const today = getStartOfDay();
              const dueDay = getStartOfDay(dueDate);
              const isOverdue = dueDay.getTime() < today.getTime() && bill.isActive;
              const isToday = dueDay.getTime() === today.getTime() && bill.isActive;
  
              return (
                <List.Item className="h-full !mb-0 block">
                  <div className="relative group block rounded-2xl p-5 border border-border/60 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden gap-4">
                    <div className="flex justify-between items-start gap-4 z-10">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(TYPOGRAPHY.cardLabel, "shrink-0")}>{index + 1}.</span>
                        <div
                          className={`p-2 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner ${!bill.isActive ? 'grayscale opacity-50' : ''}`}
                          style={{ backgroundColor: bill.color || '#6366f1' }}
                        >
                          <CategoryIcon name={bill.icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={cn(TYPOGRAPHY.cardTitle, "leading-none mb-1", !bill.isActive ? 'text-muted-foreground' : '')} title={bill.name}>{bill.name}</h3>
                          <p className={cn(TYPOGRAPHY.cardAmount, "mt-1", !bill.isActive ? 'text-muted-foreground' : '')}>
                            {format(bill.amount)} <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-normal">/ {bill.frequency}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 transition-opacity shrink-0">
                        <SubscriptionHistoryModal bill={bill} />
                        <RecurringBillForm accounts={accounts} categories={categories} bill={bill} />
                        <RecurringBillDeleteModal bill={bill} />
                      </div>
                    </div>
  
                    <div className="z-10 mt-auto">
                      <div className="space-y-3 pt-4 border-t border-border/50">
                        <div className="flex justify-between items-center">
                          <span className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5")}><Clock className="w-3 h-3" /> STARTED</span>
                          <span className={cn(TYPOGRAPHY.cardValue, "truncate max-w-[120px]")}>{formatDateString(bill.createdAt, "MMM YYYY")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5")}><Calendar className="w-3 h-3" /> NEXT DUE</span>
                          <span className={cn(TYPOGRAPHY.cardValue, "truncate max-w-[120px]", isOverdue ? 'text-destructive' : isToday ? 'text-primary' : '')}>
                            {formatDateString(dueDate, "DD MMM YYYY")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5")}><Wallet className="w-3 h-3" /> FROM</span>
                          <span className={cn(TYPOGRAPHY.cardValue, "truncate max-w-[120px]")}>{bill.accountId?.name || "Not set"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5")}><CheckCircle className="w-3 h-3" /> PAID</span>
                          <span className="font-semibold truncate max-w-[120px]">
                            <Badge variant="outline" className={cn(TYPOGRAPHY.badge)}>{bill.transactionsCount || 0} times</Badge>
                          </span>
                        </div>
                        {bill.autoPayPlatform && (
                          <div className="flex justify-between items-center">
                            <span className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5")}><Smartphone className="w-3 h-3" /> PLATFORM</span>
                            <span className={cn(TYPOGRAPHY.cardValue, "truncate max-w-[120px]")}>{bill.autoPayPlatform}</span>
                          </div>
                        )}
                      </div>
  
                      <div className="mt-5 flex items-center justify-between">
                        {(!bill.isActive || isOverdue || isToday) && (
                          <Badge variant={!bill.isActive ? "outline" : isOverdue ? "destructive" : isToday ? "default" : "secondary"} className={cn(TYPOGRAPHY.badge, "font-bold px-3 py-1")}>
                            {!bill.isActive ? "Paused" : isOverdue ? "Overdue" : "Due Today"}
                          </Badge>
                        )}
                        {!(!bill.isActive || isOverdue || isToday) && <div />}
                        
                        <div className="flex items-center gap-2">
                          {bill.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs font-semibold rounded-full hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors disabled:opacity-50" 
                              disabled={payingId === bill._id || (!isOverdue && !isToday)}
                              title={(!isOverdue && !isToday) ? "Cannot mark paid before due date" : "Mark as paid"}
                              onClick={() => handleMarkPaid(bill)}
                            >
                              {payingId === bill._id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />} 
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
  
                    {/* Decorative background circle */}
                    <div 
                      className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none ${!bill.isActive ? 'grayscale' : ''}`}
                      style={{ backgroundColor: bill.color || '#6366f1' }}
                    />
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
