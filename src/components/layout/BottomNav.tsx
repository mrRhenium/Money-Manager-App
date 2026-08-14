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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 px-2 pb-safe">
      <ul className="h-full flex items-center justify-around">
        {navItems.map((item) => (
          <li key={item.href} className="flex-1 flex justify-center">
            <Link
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                item.isMain ? "-mt-6" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center ${
                  item.isMain
                    ? "w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={item.isMain ? "w-7 h-7" : "w-5 h-5"} />
              </div>
              {!item.isMain && (
                <span className="text-[10px] font-medium text-muted-foreground">
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
