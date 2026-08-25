const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');

file = file.replace(
  /const daysFilter = parseInt\(\(searchParams\.days as string\) \|\| "7", 10\);/,
  `const daysParam = (searchParams.days as string) || "7";
  const isCustom = daysParam === "custom";
  const fromDateStr = searchParams.from as string;
  const toDateStr = searchParams.to as string;

  let daysFilter = 7;
  let customStartDate: Date | null = null;
  let customEndDate: Date | null = null;

  if (isCustom && fromDateStr && toDateStr) {
    customStartDate = new Date(fromDateStr);
    customEndDate = new Date(toDateStr);
    customEndDate.setHours(23, 59, 59, 999);
    daysFilter = Math.max(1, Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 3600 * 24)));
  } else {
    daysFilter = parseInt(daysParam, 10);
    if (isNaN(daysFilter)) daysFilter = 7;
  }`
);

file = file.replace(
  /const now = getCurrentDate\(\);\n\s*const pastDate = new Date\(now\);\n\s*pastDate\.setDate\(now\.getDate\(\) - daysFilter\);/,
  `const now = getCurrentDate();
  let pastDate = new Date(now);
  let effectiveNow = new Date(now);
  
  if (isCustom && customStartDate && customEndDate) {
    pastDate = customStartDate;
    effectiveNow = customEndDate;
  } else {
    pastDate.setDate(now.getDate() - daysFilter);
  }`
);

file = file.replace(
  /return txDate >= pastDate && txDate <= now;/,
  `return txDate >= pastDate && txDate <= effectiveNow;`
);

fs.writeFileSync('src/app/(dashboard)/page.tsx', file);
console.log('page.tsx updated with custom dates logic');
