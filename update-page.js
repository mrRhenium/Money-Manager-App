const fs = require('fs');

let page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');

const targetLogic = `
  // Calculate timeframe-based income and expenses
  const now = getCurrentDate();
  let pastDate = new Date(now);
  let effectiveNow = new Date(now);

  if (isCustom && customStartDate && customEndDate) {
    pastDate = customStartDate;
    effectiveNow = customEndDate;
  } else {
    pastDate.setDate(now.getDate() - daysFilter);
  }

  const timeframeTxns = transactions.filter((t: any) => {
    const txDate = parseToDate(t.date);
    return txDate >= pastDate && txDate <= effectiveNow;
  });`;

const replacementLogic = `
  const selectedMonths = (await props.searchParams)?.months?.split(",").map(Number) || [];
  const selectedYears = (await props.searchParams)?.years?.split(",").map(Number) || [];
  const isMonthYear = daysFilterParam === "month_year";

  // Calculate timeframe-based income and expenses
  const now = getCurrentDate();
  let pastDate = new Date(now);
  let effectiveNow = new Date(now);

  if (isCustom && customStartDate && customEndDate) {
    pastDate = customStartDate;
    effectiveNow = customEndDate;
  } else if (!isMonthYear) {
    pastDate.setDate(now.getDate() - daysFilter);
  }

  const timeframeTxns = transactions.filter((t: any) => {
    const txDate = parseToDate(t.date);
    if (isMonthYear) {
      if (selectedYears.length > 0 && !selectedYears.includes(txDate.getFullYear())) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(txDate.getMonth())) return false;
      return true;
    }
    return txDate >= pastDate && txDate <= effectiveNow;
  });`;

page = page.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);
console.log('page.tsx updated!');
