"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { SidebarMenu } from "./SidebarMenu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarClient({ user }: { user: any }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      style={{ 
        width: isCollapsed ? '88px' : '280px', 
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }} 
      className={cn(
        "hidden lg:flex flex-col relative group shrink-0 z-50",
        // Force text color in dark mode
        "dark:text-white",
        // Modern glassmorphism
        "bg-background/95 dark:bg-card/95 backdrop-blur-2xl border-r border-border/50",
        "shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)]"
      )}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-6 bg-background border border-border text-foreground hover:text-primary rounded-full p-1.5 shadow-md z-50 hover:scale-110 transition-all hover:border-primary/50"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="h-20 flex items-center px-6 border-b border-border/40 shrink-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-3 no-underline group/logo">
          <div className="relative flex items-center justify-center min-w-[40px] h-[40px] rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/20 group-hover/logo:shadow-primary/40 transition-shadow">
            <Image 
              src="/icon-192x192.png" 
              alt="Money Manager Logo" 
              fill
              sizes="40px"
              className="rounded-xl object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <h1 className="text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 whitespace-nowrap">
              Money Manager
            </h1>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 hide-scrollbar">
        <SidebarMenu role={user?.role} isCollapsed={isCollapsed} />
      </div>

      <div className="p-4 border-t border-border/40 flex flex-col gap-4 overflow-hidden shrink-0 bg-secondary/10 backdrop-blur-md">
        <div className={cn(
          "flex items-center rounded-2xl transition-all duration-300",
          isCollapsed ? "justify-center p-2" : "justify-between bg-card/60 backdrop-blur-md border border-border/50 p-2 shadow-sm"
        )}>
          <Link href="/settings" className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
            <div className="relative min-w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-background shrink-0 shadow-sm">
              {user?.image ? (
                <Image src={user.image} alt="Profile" fill sizes="40px" className="object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-foreground text-sm leading-tight whitespace-nowrap truncate">{user?.name?.split(" ")[0] || "User"}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">{user?.role === 'ADMIN' ? 'Admin' : 'Free Plan'}</span>
              </div>
            )}
          </Link>
          {!isCollapsed && <ThemeToggle />}
        </div>
      </div>
    </aside>
  );
}
