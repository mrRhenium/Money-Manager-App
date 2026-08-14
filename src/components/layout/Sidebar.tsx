import Link from "next/link";
import { Home, PieChart, Users, Wallet, Settings, Flame } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { getUserProfile } from "@/actions/user";

export async function Sidebar() {
  const user = await getUserProfile().catch(() => null);

  const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Transactions", href: "/transactions", icon: Wallet },
    { label: "Budgets", href: "/budgets", icon: PieChart },
    { label: "People", href: "/people", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-lg font-bold text-primary">Money Manager</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-border flex flex-col gap-4">
        {user && user.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-500 rounded-md">
            <Flame className="w-5 h-5" />
            <span className="font-bold">{user.currentStreak} Day Streak!</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.name?.split(" ")[0] || "User"}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
