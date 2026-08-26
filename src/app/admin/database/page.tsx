import { getDatabaseAnalytics } from "@/actions/admin";
import DatabaseDashboard from "./DatabaseDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Analytics | Admin Dashboard",
};

export default async function DatabaseAnalyticsPage() {
  const analyticsData = await getDatabaseAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your MongoDB storage allocation, collection sizes, and document counts.
        </p>
      </div>

      <DatabaseDashboard initialData={analyticsData} />
    </div>
  );
}
