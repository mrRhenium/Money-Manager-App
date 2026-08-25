const fs = require('fs');

// 1. Fix NetWorthChart.tsx
let netWorthChart = fs.readFileSync('src/components/dashboard/NetWorthChart.tsx', 'utf8');
netWorthChart = netWorthChart.replace(
  /<div className="w-full h-\[80px\]">/,
  `<div className="w-full h-full min-h-[250px]">`
);
// Make sure XAxis and YAxis are rendered
if (!netWorthChart.includes('<XAxis')) {
  netWorthChart = netWorthChart.replace(
    /<Tooltip/,
    `<XAxis dataKey="date" hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
          <YAxis hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => \`\${val / 1000}k\`} width={60} />
          <Tooltip`
  );
}
fs.writeFileSync('src/components/dashboard/NetWorthChart.tsx', netWorthChart);
console.log('NetWorthChart.tsx updated');

// 2. Rewrite UpcomingDuesWidget.tsx
const upcomingDuesContent = `"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateString, parseToDate, getCurrentDate } from "@/lib/dateTimeHelper";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Shield, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function UpcomingDuesWidget({ dues, daysAhead = 30 }: { dues: any[], daysAhead?: number }) {
  const { format } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!dues || dues.length === 0) return null;

  const totalAmount = dues.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPages = Math.ceil(dues.length / itemsPerPage);
  const paginatedDues = dues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer border border-blue-500/20 bg-blue-500/5 shadow-sm hover:bg-blue-500/10 transition-all duration-200 h-full">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-blue-800 dark:text-blue-400">Upcoming Dues</h3>
                <p className="text-sm text-blue-600 dark:text-blue-500 font-medium">
                  {dues.length} dues in next {daysAhead} days
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block sm:inline">Total Amount: </span>
              <div className="font-bold text-base text-blue-700 dark:text-blue-400 flex items-center justify-start sm:justify-end">
                {format(totalAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Dues
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-normal">Next {daysAhead} Days</Badge>
          </div>
        </DialogHeader>
        <div className="divide-y divide-border/50">
          {paginatedDues.map((due: any, idx: number) => {
            const isOverdue = parseToDate(due.dueDate) < getCurrentDate();
            let Icon = Calendar;
            let iconColor = "text-muted-foreground";

            if (due.type === "credit_card") { Icon = CreditCard; iconColor = "text-blue-500"; }
            if (due.type === "insurance") { Icon = Shield; iconColor = "text-emerald-500"; }
            if (due.type === "sip") { Icon = TrendingUp; iconColor = "text-purple-500"; }
            if (due.type === "subscription") { Icon = RefreshCw; iconColor = "text-amber-500"; }

            return (
              <div key={idx} className="flex items-center justify-between py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center bg-secondary shrink-0 \${iconColor}\`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{due.title}</h4>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Due: {formatDateString(due.dueDate, "DD-MM-YYYY")}
                      </span>
                      {isOverdue && <AlertCircle className="w-3 h-3 text-destructive" />}
                    </div>
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
`;
fs.writeFileSync('src/components/dashboard/UpcomingDuesWidget.tsx', upcomingDuesContent);
console.log('UpcomingDuesWidget.tsx updated');

// 3. Rewrite PendingConfirmationsWidget.tsx to add Pagination and fix layout
let pendingContent = fs.readFileSync('src/components/upi/PendingConfirmationsWidget.tsx', 'utf8');

// Replace state
pendingContent = pendingContent.replace(
  /const \[isModalOpen, setIsModalOpen\] = useState\(false\);/,
  `const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;`
);

// Add Pagination Logic
pendingContent = pendingContent.replace(
  /const totalAmount = pendingTxns.reduce\(\(sum, txn\) => sum \+ txn.amount, 0\);/,
  `const totalAmount = pendingTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const totalPages = Math.ceil(pendingTxns.length / itemsPerPage);
  const paginatedTxns = pendingTxns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);`
);

// Replace mapping to use paginatedTxns
pendingContent = pendingContent.replace(
  /pendingTxns\.map\(\(txn/g,
  `paginatedTxns.map((txn`
);

// Add Pagination UI right before the end of DialogContent
pendingContent = pendingContent.replace(
  /<\/DialogContent>/,
  `
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>`
);

// Replace lucide icons to include chevrons
pendingContent = pendingContent.replace(
  /import \{ Smartphone, Check, X, Clock, Loader2 \} from "lucide-react";/,
  `import { Smartphone, Check, X, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";`
);

// Fix Card dimensions
pendingContent = pendingContent.replace(
  /render=\{\n\s*<Card className="cursor-pointer border border-amber-500\/20 bg-amber-500\/5 shadow-sm hover:bg-amber-500\/10 transition-all duration-200">/,
  `asChild>
        <Card className="cursor-pointer border border-amber-500/20 bg-amber-500/5 shadow-sm hover:bg-amber-500/10 transition-all duration-200 h-full">`
);
pendingContent = pendingContent.replace(
  /<CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">/,
  `<CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full">`
);

pendingContent = pendingContent.replace(
  /<\/Card>\n\s*\} \/>/,
  `</Card>
      </DialogTrigger>`
);


fs.writeFileSync('src/components/upi/PendingConfirmationsWidget.tsx', pendingContent);
console.log('PendingConfirmationsWidget.tsx updated');
