import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { auth } from "@/lib/auth";

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden', backgroundColor: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="pb-16 md:pb-0">
        <div>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav role={role} />
      </div>
    </div>
  );
}
