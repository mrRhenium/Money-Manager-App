import { getAuditLogs } from "@/actions/auditLog";
import { AuditLogsList } from "@/components/audit/AuditLogsList";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { History } from "lucide-react";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userTimezone = (session?.user as any)?.timezone || "UTC";
  const logs = await getAuditLogs();

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><History className="w-6 h-6 text-primary" /> Audit Logs</>}
        subtitle="Detailed history of all creates, updates, and deletes of your records."
      />
      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
        <AuditLogsList logs={logs} userTimezone={userTimezone} />
      </div>
    </MasterLayout>
  );
}
