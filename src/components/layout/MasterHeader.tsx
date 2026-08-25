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
      "h-20 z-40 dark:text-white bg-card/80 backdrop-blur-md shadow-[1px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[1px_0_40px_rgba(0,0,0,0.1)] border-b py-4 px-4 lg:px-8",
      className
    )}>
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 h-full w-full">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors h-10 w-10 shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2 truncate max-w-[200px] sm:max-w-full">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-2 truncate max-w-[200px] sm:max-w-full">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
