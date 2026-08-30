import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MasterHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function MasterHeader({ title, subtitle, backHref, actions, className }: MasterHeaderProps) {
  return (
    <div className={cn(
      "h-16 sm:h-20 z-40 dark:text-white shrink-0",
      // Mobile & tablet view: same bg and blur as bottom navigator
      "bg-card/80 backdrop-blur-md border-b border-border/50",
      // Laptop view: same bg and blur as desktop sidebar
      "lg:bg-background/95 dark:lg:bg-card/95 lg:backdrop-blur-2xl",
      "shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] py-2.5 sm:py-4 px-4 lg:px-8",
      className
    )}>
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 h-full w-full min-w-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {backHref && (
            <Link replace href={backHref} className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-10 w-10 shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate w-full flex items-center gap-2" title={typeof title === "string" ? title : undefined}>
              {title}
            </h1>
            {subtitle && (
              <div className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 truncate w-full">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
