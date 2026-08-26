import { getAdminStats } from "@/actions/admin";
import { LayoutDashboard } from "lucide-react";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { MasterLayout, MasterContent } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <MasterLayout>
      <MasterHeader 
        title={<><LayoutDashboard className="w-6 h-6 text-primary" /> Admin Dashboard</>}
        subtitle="Platform overview and statistics."
      />
      <MasterContent>
        <AdminDashboardClient stats={stats} />
      </MasterContent>
    </MasterLayout>
  );
}
