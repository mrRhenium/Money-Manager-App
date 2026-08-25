const fs = require('fs');

let page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');

const oldPageLogic = `
  const selectedMonths = (await props.searchParams)?.months?.split(",").map(Number) || [];
  const selectedYears = (await props.searchParams)?.years?.split(",").map(Number) || [];
  const isMonthYear = daysFilterParam === "month_year";`;

const newPageLogic = `
  const sp = await props.searchParams;
  const rawMonths = typeof sp?.months === 'string' ? sp.months : (sp?.months?.[0] || undefined);
  const rawYears = typeof sp?.years === 'string' ? sp.years : (sp?.years?.[0] || undefined);
  const selectedMonths = rawMonths ? rawMonths.split(",").map(Number) : [];
  const selectedYears = rawYears ? rawYears.split(",").map(Number) : [];
  const isMonthYear = daysFilter === "month_year" || (sp?.days === "month_year") || (sp?.days?.[0] === "month_year");`;

page = page.replace(oldPageLogic, newPageLogic);
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);

let filter = fs.readFileSync('src/components/dashboard/DashboardAdvancedFilter.tsx', 'utf8');
filter = filter.replace(`params.set("days", val);`, `params.set("days", val as string);`);
fs.writeFileSync('src/components/dashboard/DashboardAdvancedFilter.tsx', filter);

console.log('Fixed types!');
