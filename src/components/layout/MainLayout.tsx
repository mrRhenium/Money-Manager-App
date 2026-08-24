import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden', backgroundColor: 'hsl(var(--background))' }}>
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
        <BottomNav />
      </div>
    </div>
  );
}
