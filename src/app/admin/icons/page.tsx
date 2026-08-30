import { getAllIconsAdmin } from "@/actions/icon";
import { AdminIconsClient } from "./AdminIconsClient";
import { MasterLayout } from "@/components/layout/MasterLayout";

export const dynamic = "force-dynamic";

export default async function AdminIconsPage() {
  const icons = await getAllIconsAdmin();

  return (
    <MasterLayout>
      <AdminIconsClient icons={icons} />
    </MasterLayout>
  );
}
