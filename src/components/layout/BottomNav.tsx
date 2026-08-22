"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, QrCode, Users, Wallet, Menu, Landmark, Tags, TrendingUp, CreditCard, Settings, History, Repeat, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { ScanAndPayModal } from "../upi/ScanAndPayModal";

export function BottomNav() {
  const pathname = usePathname();
  const [scanOpen, setScanOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Transactions", href: "/transactions", icon: Wallet },
    { label: "Add", href: "#", icon: QrCode, isMain: true },
    { label: "Budgets", href: "/budgets", icon: PieChart },
    { label: "Menu", href: "#", icon: Menu, isMenu: true },
  ];

  const menuItems = [
    { href: "/accounts", icon: Landmark, label: "Accounts" },
    { href: "/categories", icon: Tags, label: "Categories" },
    { href: "/goals", icon: Target, label: "Goals" },
    { href: "/subscriptions", icon: Repeat, label: "Subscriptions" },
    { href: "/investments", icon: TrendingUp, label: "Investments" },
    { href: "/credit-cards", icon: CreditCard, label: "Credit Cards" },
    { href: "/people", icon: Users, label: "People" },
    { href: "/audit-logs", icon: History, label: "Audit Logs" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-t border-border/50 z-50 px-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <ul className="h-full flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          const NavItemContent = (
            <div className={`flex flex-col items-center justify-center w-full h-full space-y-1 group ${item.isMain ? "-mt-6" : ""}`}>
              <div
                className={`flex items-center justify-center transition-all ${
                  item.isMain
                    ? "w-14 h-14 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 group-hover:scale-105"
                    : isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                }`}
              >
                <item.icon className={`${item.isMain ? "w-6 h-6" : "w-5 h-5 group-hover:-translate-y-0.5 transition-transform"}`} />
              </div>
              {!item.isMain && (
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                  {item.label}
                </span>
              )}
            </div>
          );

          if (item.isMenu) {
            return (
              <li key="menu" className="flex-1 flex justify-center h-full">
                <Dialog>
                  <DialogTrigger className="w-full h-full outline-none">
                    {NavItemContent}
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">More Options</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                      {menuItems.map((menuItem) => (
                        <Link
                          key={menuItem.href}
                          href={menuItem.href}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                        >
                          <div className={`p-3 rounded-full ${pathname === menuItem.href ? "bg-primary text-primary-foreground shadow-md scale-110" : "bg-secondary text-secondary-foreground"}`}>
                            <menuItem.icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs font-medium text-center ${pathname === menuItem.href ? "text-primary font-bold" : "text-foreground"}`}>
                            {menuItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
            );
          }

          if (item.isMain) {
            return (
              <li key="add" className="flex-1 flex justify-center h-full">
                <button onClick={() => setScanOpen(true)} className="w-full h-full outline-none focus:outline-none">
                  {NavItemContent}
                </button>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1 flex justify-center h-full">
              <Link href={item.href} className="w-full h-full">
                {NavItemContent}
              </Link>
            </li>
          );
        })}
      </ul>
      <ScanAndPayModal open={scanOpen} onOpenChange={setScanOpen} />
    </nav>
  );
}
