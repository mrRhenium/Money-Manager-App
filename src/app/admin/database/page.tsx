import { getDatabaseAnalytics } from "@/actions/admin";
import DatabaseDashboard from "./DatabaseDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Analytics | Admin Dashboard",
};

export default async function DatabaseAnalyticsPage() {
  const analyticsData = await getDatabaseAnalytics();

  return <DatabaseDashboard initialData={analyticsData} />;
}
