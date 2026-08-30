import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { AppNavigationManager } from "./AppNavigationManager";
import { auth } from "@/lib/auth";

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Enforce Hub-and-Spoke Back Navigation */}
      <AppNavigationManager />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="pb-16 lg:pb-0">
        <div>
          {children}
        </div>
      </main>

      {/* Mobile/Tablet Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav role={role} />
      </div>
    </div>
  );
}
