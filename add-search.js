const fs = require('fs');

// 1. Update UpcomingDuesWidget.tsx
let upcoming = fs.readFileSync('src/components/dashboard/UpcomingDuesWidget.tsx', 'utf8');

if (!upcoming.includes('import { Input }')) {
  upcoming = upcoming.replace(
    /import \{ Button \} from "@\/components\/ui\/button";/,
    `import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\nimport { Search } from "lucide-react";`
  );
}

upcoming = upcoming.replace(
  /const \[currentPage, setCurrentPage\] = useState\(1\);/,
  `const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");`
);

// Filter logic
upcoming = upcoming.replace(
  /const totalAmount = dues\.reduce\(\(acc, curr\) => acc \+ curr\.amount, 0\);\s*const totalPages = Math\.ceil\(dues\.length \/ itemsPerPage\);\s*const paginatedDues = dues\.slice\(\(currentPage - 1\) \* itemsPerPage, currentPage \* itemsPerPage\);/,
  `
  const filteredDues = dues.filter(due => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const dateStr = formatDateString(due.dueDate, "DD-MM-YYYY");
    return (
      (due.title || "").toLowerCase().includes(s) ||
      (due.type || "").toLowerCase().includes(s) ||
      due.amount.toString().includes(s) ||
      dateStr.includes(s)
    );
  });
  const totalAmount = filteredDues.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPages = Math.ceil(filteredDues.length / itemsPerPage);
  const paginatedDues = filteredDues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);`
);

upcoming = upcoming.replace(
  /<Badge variant="outline" className="text-xs font-normal">Next \{daysAhead\} Days<\/Badge>\s*<\/div>\s*<\/DialogHeader>/,
  `<Badge variant="outline" className="text-xs font-normal">Next {daysAhead} Days</Badge>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, amount, date, or type..."
              className="pl-9 bg-background w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </DialogHeader>`
);

fs.writeFileSync('src/components/dashboard/UpcomingDuesWidget.tsx', upcoming);

// 2. Update PendingConfirmationsWidget.tsx
let pending = fs.readFileSync('src/components/upi/PendingConfirmationsWidget.tsx', 'utf8');

if (!pending.includes('import { Input }')) {
  pending = pending.replace(
    /import \{ Button \} from "@\/components\/ui\/button";/,
    `import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\nimport { Search } from "lucide-react";`
  );
}

pending = pending.replace(
  /const \[currentPage, setCurrentPage\] = useState\(1\);/,
  `const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");`
);

pending = pending.replace(
  /const totalAmount = pendingTxns\.reduce\(\(sum, txn\) => sum \+ txn\.amount, 0\);\s*const totalPages = Math\.ceil\(pendingTxns\.length \/ itemsPerPage\);\s*const paginatedTxns = pendingTxns\.slice\(\(currentPage - 1\) \* itemsPerPage, currentPage \* itemsPerPage\);/,
  `
  const filteredTxns = pendingTxns.filter(txn => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const receiver = (txn.note || txn.partyName || "UPI Recipient").toLowerCase();
    const dateStr = formatDateString(txn.date, "DD-MM-YYYY");
    return (
      receiver.includes(s) ||
      txn.amount.toString().includes(s) ||
      dateStr.includes(s)
    );
  });
  
  const totalAmount = pendingTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);
  const paginatedTxns = filteredTxns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);`
);

pending = pending.replace(
  /<\/DialogTitle>\s*<p className="text-xs text-muted-foreground mt-1">\s*Confirm whether these UPI payments were successful or cancelled to keep your balances aligned\.\s*<\/p>\s*<\/DialogHeader>/,
  `</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Confirm whether these UPI payments were successful or cancelled to keep your balances aligned.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by receiver name, amount, or date..."
              className="pl-9 bg-background w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </DialogHeader>`
);

// Enhance Pending Confirmations UI
pending = pending.replace(
  /const payeeName = txn\.note\?\.replace\("UPI Payment to ", ""\) \|\| "UPI Recipient";/,
  `const payeeName = txn.partyName || txn.note?.replace("UPI Payment to ", "") || "UPI Recipient";
            const noteText = txn.note || "No note attached";`
);

pending = pending.replace(
  /<p className="font-bold text-sm text-foreground">\{payeeName\}<\/p>\s*<p className="text-xs text-muted-foreground mt-1 truncate max-w-\[200px\]">\s*Amount: <span className="font-semibold text-foreground">\{format\(txn\.amount\)\}<\/span> • \{formatDateString\(txn\.date, "DD-MM-YYYY"\)\}\s*<\/p>/,
  `<p className="font-bold text-sm text-foreground">{payeeName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground bg-primary/10 px-1.5 py-0.5 rounded mr-2">{format(txn.amount)}</span>
                    {formatDateString(txn.date, "DD-MM-YYYY hh:mm A")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic opacity-80">
                    "{noteText}"
                  </p>`
);

fs.writeFileSync('src/components/upi/PendingConfirmationsWidget.tsx', pending);

console.log('Search bars and enhanced UI added to popups');
