const fs = require('fs');

// ===== FIX 1: My UPI button dark theme visibility =====
let page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');
page = page.replace(
  /<Link href="\/my-upi" className=\{buttonVariants\(\{ variant: "outline" \}\)\}>/,
  `<Link href="/my-upi" className={buttonVariants({ variant: "outline" }) + " border-primary/30 text-foreground hover:bg-primary/10"}>`
);
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);
console.log('FIX 1: My UPI button dark theme - DONE');

// ===== FIX 2: Pending UPI entries - show people name + UPI ID =====
// First, update getPendingTransactions to populate personId
let txAction = fs.readFileSync('src/actions/transaction.ts', 'utf8');
txAction = txAction.replace(
  `.populate("toAccountId", "name type")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}
`,
  `.populate("toAccountId", "name type")
  .populate("personId", "name phone")
  .lean();

  return JSON.parse(JSON.stringify(transactions));
}
`
);
fs.writeFileSync('src/actions/transaction.ts', txAction);
console.log('FIX 2a: getPendingTransactions now populates personId - DONE');

// Now update PendingConfirmationsWidget to show payee name + UPI ID
let pending = fs.readFileSync('src/components/upi/PendingConfirmationsWidget.tsx', 'utf8');
pending = pending.replace(
  `const payeeName = txn.partyName || txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const noteText = txn.note || "No note attached";`,
  `const payeeName = txn.upiPayeeName || txn.personId?.name || txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const upiId = txn.upiPayeeVpa || "";
            const personName = txn.personId?.name || "";
            const noteText = txn.note || "No note attached";`
);
pending = pending.replace(
  `<p className="font-bold text-sm text-foreground">{payeeName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground bg-primary/10 px-1.5 py-0.5 rounded mr-2">{format(txn.amount)}</span>
                    {formatDateString(txn.date, "DD-MM-YYYY hh:mm A")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic opacity-80">
                    "{noteText}"
                  </p>`,
  `<p className="font-bold text-sm text-foreground">{payeeName}</p>
                  {upiId && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{upiId}</p>}
                  {personName && personName !== payeeName && <p className="text-[11px] text-primary/80 mt-0.5">👤 {personName}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground bg-primary/10 px-1.5 py-0.5 rounded">{format(txn.amount)}</span>
                    <span>•</span>
                    <span>{formatDateString(txn.date, "DD-MM-YYYY hh:mm A")}</span>
                    {txn.accountId?.name && <><span>•</span><span>{txn.accountId.name}</span></>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic opacity-80">
                    "{noteText}"
                  </p>`
);
// Also update search filter to include upiPayeeName and upiPayeeVpa
pending = pending.replace(
  `const receiver = (txn.note || txn.partyName || "UPI Recipient").toLowerCase();`,
  `const receiver = (txn.upiPayeeName || txn.personId?.name || txn.note || "UPI Recipient").toLowerCase();
    const upiVpa = (txn.upiPayeeVpa || "").toLowerCase();`
);
pending = pending.replace(
  `return (
      receiver.includes(s) ||
      txn.amount.toString().includes(s) ||
      dateStr.includes(s)
    );`,
  `return (
      receiver.includes(s) ||
      upiVpa.includes(s) ||
      txn.amount.toString().includes(s) ||
      dateStr.includes(s)
    );`
);
fs.writeFileSync('src/components/upi/PendingConfirmationsWidget.tsx', pending);
console.log('FIX 2b: Pending UPI entries now show name + UPI ID - DONE');

// ===== FIX 3: Upcoming Dues - show ALL dues (not limited by daysFilter) =====
page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');
// Change the nextXDays to 365 days for collecting all dues, pass daysFilter separately
page = page.replace(
  `const upcomingDues: any[] = [];
  const nextXDays = getCurrentDate();
  nextXDays.setDate(now.getDate() + daysFilter);`,
  `const upcomingDues: any[] = [];
  const nextXDays = getCurrentDate();
  nextXDays.setDate(now.getDate() + 365);`
);
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);
console.log('FIX 3: Upcoming Dues now shows ALL dues (365 days) - DONE');

// ===== FIX 5: Recent Activity overflow fix =====
page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');
page = page.replace(
  `<Card className="lg:col-span-3 border-none shadow-sm hover:shadow-md transition-all flex flex-col">`,
  `<Card className="lg:col-span-3 border-none shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">`
);
page = page.replace(
  `<CardContent className="flex-1 overflow-y-auto overflow-x-hidden max-h-[320px] pr-2 custom-scrollbar">`,
  `<CardContent className="flex-1 overflow-y-auto overflow-x-hidden max-h-[320px] px-4 custom-scrollbar">`
);
page = page.replace(
  `<div key={t._id} className="flex items-center justify-between group cursor-pointer hover:bg-secondary/40 p-2 -mx-2 rounded-lg transition-colors">`,
  `<div key={t._id} className="flex items-center justify-between group cursor-pointer hover:bg-secondary/40 p-2 rounded-lg transition-colors">`
);
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);
console.log('FIX 5: Recent Activity overflow fix - DONE');

console.log('\\nAll 5 fixes applied!');
