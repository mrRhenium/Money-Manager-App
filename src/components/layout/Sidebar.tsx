import Link from "next/link";
import { Home, PieChart, Users, Wallet, Settings, Flame, ShieldAlert } from "lucide-react";
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

  if (user?.role === "ADMIN") {
    navItems.push({ label: "Admin Portal", href: "/admin/dashboard", icon: ShieldAlert });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Money Manager</h1>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-medium group cursor-pointer"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border/50 flex flex-col gap-4">
        {user && user.currentStreak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg shadow-sm border border-orange-500/10">
            <Flame className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm">{user.currentStreak} Day Streak!</span>
          </div>
        )}
        <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/20">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-sm flex flex-col">
              <p className="font-semibold text-foreground leading-none">{user?.name?.split(" ")[0] || "User"}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-none">Free Plan</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
