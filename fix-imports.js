const fs = require('fs');

// Fix page.tsx imports
let page = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');
if (!page.includes('buttonVariants')) {
  page = page.replace(
    /import \{ Button \} from "@\/components\/ui\/button";/,
    `import { Button, buttonVariants } from "@/components/ui/button";`
  );
}
if (!page.includes('QrCode')) {
  page = page.replace(
    /Briefcase/,
    `Briefcase, QrCode`
  );
}
if (!page.includes('DashboardScanTrigger')) {
  page = page.replace(
    /import \{ PendingConfirmationsWidget \} from "@\/components\/upi\/PendingConfirmationsWidget";/,
    `import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";\nimport { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";`
  );
}
fs.writeFileSync('src/app/(dashboard)/page.tsx', page);

// Fix UpcomingDuesWidget DialogTrigger
let upcoming = fs.readFileSync('src/components/dashboard/UpcomingDuesWidget.tsx', 'utf8');
upcoming = upcoming.replace(
  /<DialogTrigger asChild>/,
  `<DialogTrigger render={`
).replace(
  /<\/DialogTrigger>/,
  `} />`
);
fs.writeFileSync('src/components/dashboard/UpcomingDuesWidget.tsx', upcoming);

// Fix PendingConfirmationsWidget DialogTrigger
let pending = fs.readFileSync('src/components/upi/PendingConfirmationsWidget.tsx', 'utf8');
pending = pending.replace(
  /<DialogTrigger asChild>/,
  `<DialogTrigger render={`
).replace(
  /<\/DialogTrigger>/,
  `} />`
);
fs.writeFileSync('src/components/upi/PendingConfirmationsWidget.tsx', pending);

console.log('Fixed imports and DialogTrigger rendering for base-ui');
