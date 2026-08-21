import { getUserProfile } from "@/actions/user";
import { SidebarClient } from "./SidebarClient";

export async function Sidebar() {
  const user = await getUserProfile().catch(() => null);

  return <SidebarClient user={user} />;
}
