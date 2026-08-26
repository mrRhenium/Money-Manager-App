import { getDatabaseAnalytics } from "@/actions/admin";
import DatabaseDashboard from "./DatabaseDashboard";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Database Analytics | Admin Dashboard",
};

export default async function DatabaseAnalyticsPage() {
  try {
    const analyticsData = await getDatabaseAnalytics();
    return <DatabaseDashboard initialData={analyticsData} />;
  } catch (error: any) {
    console.error("PAGE LEVEL ERROR:", error);
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error Loading Database Analytics</h1>
        <p className="font-mono bg-red-50 p-4 rounded-lg">{error.message}</p>
      </div>
    );
  }
}
