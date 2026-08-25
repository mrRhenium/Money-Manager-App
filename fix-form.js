const fs = require('fs');
let code = fs.readFileSync('src/components/forms/RecurringBillForm.tsx', 'utf8');

// Props
code = code.replace(/bill\?: any;\n\}/, 'bill?: any;\n  viewOnly?: boolean;\n}');
code = code.replace(/\{ accounts, categories, triggerClassName, bill \}/, '{ accounts, categories, triggerClassName, bill, viewOnly }');

// Imports
code = code.replace(/Folder \} from "lucide-react"/, 'Folder, Eye } from "lucide-react"');

// Icon
code = code.replace(/<PenLine className="w-4 h-4" \/>/, '{viewOnly ? <Eye className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}');

// Title
code = code.replace(/bill \? "Edit Subscription" : "Add Subscription \/ Auto-Pay"/, 'bill ? (viewOnly ? "View Subscription" : "Edit Subscription") : "Add Subscription / Auto-Pay"');

// Disable fields
code = code.replace(/<Input placeholder/g, '<Input disabled={viewOnly} placeholder');
code = code.replace(/<CurrencyInput /g, '<CurrencyInput disabled={viewOnly} ');
code = code.replace(/<Select\n/g, '<Select disabled={viewOnly}\n');
code = code.replace(/<Select\s+className/g, '<Select disabled={viewOnly} className');
code = code.replace(/<Switch /g, '<Switch disabled={viewOnly} ');
code = code.replace(/<IconPicker /g, '<IconPicker disabled={viewOnly} ');
code = code.replace(/<ColorPicker /g, '<ColorPicker disabled={viewOnly} ');

// Hide submit button
code = code.replace(/<Button type="submit"/, '{!viewOnly && <Button type="submit"');
code = code.replace(/Saving... <\/span>\) : \("Save Subscription"\)}<\/Button>/, 'Saving... </span>) : ("Save Subscription")}</Button>}');

fs.writeFileSync('src/components/forms/RecurringBillForm.tsx', code);
console.log('Done');
