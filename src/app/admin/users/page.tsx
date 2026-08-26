import { getAllUsers } from "@/actions/admin";
import { AdminUsersClient } from "./AdminUsersClient";
import { formatDate } from "@/lib/helpers";
import { auth } from "@/lib/auth";
import { MasterLayout, MasterContent } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await auth();
  const userTimezone = (session?.user as any)?.timezone || "UTC";
  
  const users = await getAllUsers();

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><Users className="w-6 h-6 text-primary" /> Manage Users</>}
        subtitle="View and manage all registered users."
      />
      <MasterContent>
        <AdminUsersClient users={users} userTimezone={userTimezone} />
      </MasterContent>
    </MasterLayout>
  );
}
