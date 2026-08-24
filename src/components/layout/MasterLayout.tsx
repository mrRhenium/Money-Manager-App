import React from "react";
import { cn } from "@/lib/utils";

interface MasterLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MasterLayout({ children, className }: MasterLayoutProps) {
  return (
    <div className={cn("absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden", className)}>
      {children}
    </div>
  );
}

interface MasterContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MasterContent({ children, className }: MasterContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto custom-scrollbar pb-24 pt-4 px-4 sm:px-6 lg:px-8", className)}>
      <div className="max-w-7xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
