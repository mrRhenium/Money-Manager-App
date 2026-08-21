import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: '64px' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '24px' }}>
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
