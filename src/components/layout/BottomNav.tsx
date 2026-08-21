import Link from "next/link";
import { Home, PieChart, PlusCircle, Users, Wallet } from "lucide-react";

export function BottomNav() {
  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Wallets", href: "/transactions", icon: Wallet },
    { label: "Add", href: "/add", icon: PlusCircle, isMain: true },
    { label: "Budgets", href: "/budgets", icon: PieChart },
    { label: "People", href: "/people", icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-md border-t border-border/50 z-50 px-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <ul className="h-full flex items-center justify-around">
        {navItems.map((item) => (
          <li key={item.href} className="flex-1 flex justify-center">
            <Link
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 group ${
                item.isMain ? "-mt-6" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center transition-all ${
                  item.isMain
                    ? "w-14 h-14 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg shadow-primary/30 group-hover:scale-105"
                    : "text-muted-foreground group-hover:text-primary"
                }`}
              >
                <item.icon className={`${item.isMain ? "w-6 h-6" : "w-5 h-5 group-hover:-translate-y-0.5 transition-transform"}`} />
              </div>
              {!item.isMain && (
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
