const fs = require('fs');
let file = fs.readFileSync('src/app/(dashboard)/page.tsx', 'utf8');

file = file.replace(
  /<div className="flex items-center gap-3">\s*<DashboardAdvancedFilter \/>\s*<\/div>/,
  `<div className="flex items-center gap-3">
          <Link href="/my-upi" className={buttonVariants({ variant: "outline" })}>
            <QrCode className="w-4 h-4 mr-2" /> My UPI
          </Link>
          <DashboardScanTrigger />
        </div>`
);

// We need to inject <DashboardAdvancedFilter /> right below the ACTION CENTER
// Actually, it might be better right above the KPIs.
file = file.replace(
  /\{\/\* ZONE 2: MACRO OVERVIEW \(KPIs\) \*\/\}/,
  `<div className="flex justify-end my-4">
        <DashboardAdvancedFilter />
      </div>

      {/* ZONE 2: MACRO OVERVIEW (KPIs) */}`
);

// We also need to make sure buttonVariants and QrCode are imported in page.tsx if they aren't already.
// Let's add them to imports if missing.
if (!file.includes('buttonVariants')) {
  file = file.replace(
    /import \{ Button \} from "@\/components\/ui\/button";/g,
    `import { Button, buttonVariants } from "@/components/ui/button";`
  );
  if (!file.includes('import { Button, buttonVariants }')) {
    file = file.replace(
      /import \{ Card, CardContent, CardHeader, CardTitle \} from "@\/components\/ui\/card";/,
      `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";\nimport { Button, buttonVariants } from "@/components/ui/button";`
    );
  }
}
if (!file.includes('QrCode')) {
  file = file.replace(
    /Briefcase\n\} from "lucide-react";/,
    `Briefcase,\n  QrCode\n} from "lucide-react";`
  );
}

// Ensure DashboardScanTrigger is imported
if (!file.includes('DashboardScanTrigger')) {
  file = file.replace(
    /import \{ PendingConfirmationsWidget \} from "@\/components\/upi\/PendingConfirmationsWidget";/,
    `import { PendingConfirmationsWidget } from "@/components/upi/PendingConfirmationsWidget";\nimport { DashboardScanTrigger } from "@/components/upi/DashboardScanTrigger";`
  );
}


fs.writeFileSync('src/app/(dashboard)/page.tsx', file);
console.log('page.tsx layout updated');
