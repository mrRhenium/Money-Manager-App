import { getAuditLogs } from "@/actions/auditLog";
import { AuditLogsList } from "@/components/audit/AuditLogsList";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { History } from "lucide-react";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Account from "@/models/Account";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();
  const userTimezone = (session?.user as any)?.timezone || "UTC";

  const [logs, categories, accounts] = await Promise.all([
    getAuditLogs(),
    Category.find({ userId: session.user.id }).select("name _id").lean(),
    Account.find({ userId: session.user.id }).select("name _id").lean(),
  ]);

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><History className="w-6 h-6 text-primary" /> Audit Logs</>}
        subtitle="Detailed history of all creates, updates, and deletes of your records."
      />
      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
        <AuditLogsList
          logs={logs}
          userTimezone={userTimezone}
          categories={JSON.parse(JSON.stringify(categories))}
          accounts={JSON.parse(JSON.stringify(accounts))}
        />
      </div>
    </MasterLayout>
  );
}
