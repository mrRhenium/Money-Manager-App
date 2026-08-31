import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { TYPOGRAPHY } from "@/lib/designTokens";

export type KPICardTheme = 'primary' | 'emerald' | 'indigo' | 'amber' | 'destructive' | 'purple' | 'blue' | 'default';

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  themeColor?: KPICardTheme;
  trend?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export function KPICard({ label, value, icon: Icon, themeColor = 'default', trend, className, action, onClick }: KPICardProps) {

  const themeStyles = {
    primary: {
      badge: "bg-primary/10 text-primary border-primary/20 ring-primary/10",
      glow: "from-primary/15",
      border: "border-l-primary",
      borderHover: "hover:border-primary/40",
      shadow: "hover:shadow-primary/5"
    },
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ring-emerald-500/10",
      glow: "from-emerald-500/15",
      border: "border-l-emerald-500",
      borderHover: "hover:border-emerald-500/40",
      shadow: "hover:shadow-emerald-500/5"
    },
    indigo: {
      badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 ring-indigo-500/10",
      glow: "from-indigo-500/15",
      border: "border-l-indigo-500",
      borderHover: "hover:border-indigo-500/40",
      shadow: "hover:shadow-indigo-500/5"
    },
    purple: {
      badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 ring-purple-500/10",
      glow: "from-purple-500/15",
      border: "border-l-purple-500",
      borderHover: "hover:border-purple-500/40",
      shadow: "hover:shadow-purple-500/5"
    },
    blue: {
      badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 ring-blue-500/10",
      glow: "from-blue-500/15",
      border: "border-l-blue-500",
      borderHover: "hover:border-blue-500/40",
      shadow: "hover:shadow-blue-500/5"
    },
    amber: {
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 ring-amber-500/10",
      glow: "from-amber-500/15",
      border: "border-l-amber-500",
      borderHover: "hover:border-amber-500/40",
      shadow: "hover:shadow-amber-500/5"
    },
    destructive: {
      badge: "bg-destructive/10 text-destructive border-destructive/20 ring-destructive/10",
      glow: "from-destructive/15",
      border: "border-l-destructive",
      borderHover: "hover:border-destructive/40",
      shadow: "hover:shadow-destructive/5"
    },
    default: {
      badge: "bg-muted text-muted-foreground border-border/50 ring-border/20",
      glow: "from-muted/20",
      border: "border-l-muted-foreground/40",
      borderHover: "hover:border-border",
      shadow: "hover:shadow-black/5"
    }
  };

  const style = themeStyles[themeColor] || themeStyles.default;

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-card py-2.5 px-3.5 sm:py-3 sm:px-4 border-l-[3.5px]",
        "transition-all duration-300 ease-out shadow-xs",
        "hover:-translate-y-0.5 hover:shadow-md",
        style.border,
        style.borderHover,
        style.shadow,
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Ambient Top-Right Radial Glow */}
      <div 
        className={cn(
          "absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-bl to-transparent opacity-35 blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-65",
          style.glow
        )} 
      />

      {/* Header: Label + Frosted Icon Badge */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <span className={cn(TYPOGRAPHY.kpiLabel, "truncate")}>
          {label}
        </span>
        <div className={cn(
          "w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg border flex items-center justify-center shrink-0 ring-1.5 transition-transform duration-300 group-hover:scale-105 shadow-2xs",
          style.badge
        )}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      {/* Metric Value */}
      <div className="mt-1 sm:mt-1.5 relative z-10">
        <div className={cn(TYPOGRAPHY.cardAmount, "font-extrabold text-foreground tracking-tight tabular-nums truncate leading-tight")}>
          {value}
        </div>

        {trend && (
          <div className={cn(TYPOGRAPHY.kpiSubtitle, "mt-1 flex items-center gap-1.5 flex-wrap [&_*]:!text-[length:inherit]")}>
            {trend}
          </div>
        )}

        {action && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
}
