import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { getUserProfile } from "@/actions/user";
import { SidebarMenu } from "./SidebarMenu";

export async function Sidebar() {
  const user = await getUserProfile().catch(() => null);

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', width: '256px', borderRight: '1px solid #e2e8f0', backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} className="hidden md:flex">
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #e2e8f0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            M
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Money Manager</h1>
        </Link>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        <SidebarMenu role={user?.role} />
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {user && user.currentStreak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#fff7ed', color: '#ea580c', borderRadius: '8px', border: '1px solid #ffedd5' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>🔥 {user.currentStreak} Day Streak!</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0ea5e9' }}>
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', lineHeight: 1 }}>{user?.name?.split(" ")[0] || "User"}</span>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1 }}>Free Plan</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
