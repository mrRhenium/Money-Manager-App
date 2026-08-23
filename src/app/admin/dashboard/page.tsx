import { getAdminStats } from "@/actions/admin";
import { Users, Grid, Banknote } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalUsers}</div>
        </div>

        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Currencies Supported</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalCurrencies}</div>
        </div>
      </div>
    </div>
  );
}
