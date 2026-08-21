import { getAuditLogs } from "@/actions/auditLog";
import { AuditLogsList } from "@/components/audit/AuditLogsList";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userTimezone = (session?.user as any)?.timezone || "UTC";
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Detailed history of all creates, updates, and deletes of your records.</p>
      </div>

      <AuditLogsList logs={logs} userTimezone={userTimezone} />
    </div>
  );
}
