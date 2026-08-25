import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type KPICardTheme = 'primary' | 'emerald' | 'indigo' | 'amber' | 'destructive' | 'default';

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  themeColor?: KPICardTheme;
  trend?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function KPICard({ label, value, icon: Icon, themeColor = 'default', trend, className, action }: KPICardProps) {

  const themeStyles = {
    primary: {
      hover: "hover:to-primary/5 dark:hover:to-primary/10",
      text: "text-primary",
      border: "border-l-primary"
    },
    emerald: {
      hover: "hover:to-emerald-500/5 dark:hover:to-emerald-500/10",
      text: "text-emerald-500",
      border: "border-l-emerald-500"
    },
    indigo: {
      hover: "hover:to-indigo-500/5 dark:hover:to-indigo-500/10",
      text: "text-indigo-500",
      border: "border-l-indigo-500"
    },
    amber: {
      hover: "hover:to-amber-500/5 dark:hover:to-amber-500/10",
      text: "text-amber-500",
      border: "border-l-amber-500"
    },
    destructive: {
      hover: "hover:to-destructive/5 dark:hover:to-destructive/10",
      text: "text-destructive",
      border: "border-l-destructive"
    },
    default: {
      hover: "hover:to-muted dark:hover:to-muted/50",
      text: "text-muted-foreground",
      border: "border-l-muted"
    }
  };

  const style = themeStyles[themeColor] || themeStyles.default;

  return (
    <Card className={cn(
      "shadow-sm bg-gradient-to-br from-card to-card border border-slate-200/60 dark:border-slate-800 transition-all duration-300 relative overflow-hidden",
      style.hover,
      className
    )}>
      <div className={cn("absolute top-0 right-0 p-2 sm:p-3 opacity-50", style.text)}>
        <Icon className="w-4 h-4" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 pb-0 sm:pb-0">
        <CardTitle className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate z-10 relative">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 pt-0 sm:pt-0 z-10 relative">
        <div className="text-base sm:text-xl font-bold truncate mt-0.5">
          {value}
        </div>
        {trend && (
          <div className="mt-1">
            {trend}
          </div>
        )}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
