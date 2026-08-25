const fs = require('fs');
let code = fs.readFileSync('src/components/forms/SubscriptionHistoryModal.tsx', 'utf8');

// Imports
code = code.replace(/import \{ History, Loader2 \} from "lucide-react";/, 'import { History, Loader2, Search } from "lucide-react";\nimport { Input } from "@/components/ui/input";\nimport { Pagination } from "antd";');

// State
code = code.replace(/const \[loading, setLoading\] = useState\(false\);/, 'const [loading, setLoading] = useState(false);\n  const [searchTerm, setSearchTerm] = useState("");\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 5;');

// Logic
const newLogic = `
  const filteredTransactions = transactions.filter(tx => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const dateStr = formatDateString(tx.date, "DD-MM-YYYY");
    const amountStr = tx.amount.toString();
    return dateStr.includes(q) || amountStr.includes(q) || (tx.note || "").toLowerCase().includes(q);
  });

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
`;
code = code.replace(/useEffect\(\(\) => \{\n    if \(open\)/, newLogic + '\n  useEffect(() => {\n    if (open)');

// UI Search Bar
const uiSearch = `
        <div className="px-0 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by date (DD-MM-YYYY) or amount..." 
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
`;
code = code.replace(/<div className="py-4 space-y-4 max-h-\[60vh\] overflow-y-auto pr-2">/, uiSearch + '        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">');

// Rendering mapping
code = code.replace(/transactions\.map\(/, 'paginatedTransactions.map(');
code = code.replace(/transactions\.length === 0/, 'filteredTransactions.length === 0');
code = code.replace(/No payments recorded yet\./, '{searchTerm ? "No matching payments found." : "No payments recorded yet."}');

// Pagination
const paginationUI = `
            </div>
          )}
        </div>
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center pt-2 pb-2">
            <Pagination 
              current={currentPage} 
              pageSize={ITEMS_PER_PAGE} 
              total={filteredTransactions.length} 
              onChange={setCurrentPage} 
              size="small" 
            />
          </div>
        )}
`;
code = code.replace(/            <\/div>\n          \)}\n        <\/div>/, paginationUI);

fs.writeFileSync('src/components/forms/SubscriptionHistoryModal.tsx', code);
console.log('Done');
