"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Home, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Users, 
  Settings,
  ShieldCheck,
  Landmark,
  Tags,
  TrendingUp,
  History,
  Repeat,
  Umbrella,
  Target,
  UploadCloud
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarMenu({ role, isCollapsed }: { role?: string, isCollapsed?: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/accounts", icon: Landmark, label: "Accounts" },
    { href: "/transactions", icon: Wallet, label: "Transactions" },
    { href: "/import", icon: UploadCloud, label: "Import" },
    { href: "/categories", icon: Tags, label: "Categories" },
    { href: "/credit-cards", icon: CreditCard, label: "Credit Cards" },
    { href: "/budgets", icon: PieChart, label: "Budgets" },
    { href: "/goals", icon: Target, label: "Goals" },
    { href: "/subscriptions", icon: Repeat, label: "Subscriptions" },
    { href: "/investments", icon: TrendingUp, label: "Investments" },
    { href: "/insurance", icon: Umbrella, label: "Insurance" },
    { href: "/people", icon: Users, label: "People" },
    { href: "/audit-logs", icon: History, label: "Audit Logs" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  if (role === "ADMIN") {
    items.push({ href: "/admin/dashboard", icon: ShieldCheck, label: "Admin Portal" });
  }

  return (
    <TooltipProvider delay={0}>
      <nav className="flex flex-col gap-2 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:scale-[1.02]"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
              )}
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110 drop-shadow-sm")} />
              
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap z-10 transition-colors">
                  {item.label}
                </span>
              )}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger render={
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-300 relative group overflow-hidden",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:scale-[1.02]"
                  )}
                />
              }>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                )}
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110 drop-shadow-sm")} />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={15} arrowClassName="bg-[#0ea5e9] fill-[#0ea5e9]" className="bg-[#0ea5e9] text-white font-semibold rounded-lg shadow-lg border-0 py-2 px-4 text-[14px]">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.href}>{content}</div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
