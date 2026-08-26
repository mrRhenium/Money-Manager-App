import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Grid, LayoutDashboard, ArrowLeft, Banknote, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Manage Users", href: "/admin/users", icon: Users },
    { name: "Currencies", href: "/admin/currencies", icon: Banknote },
    { name: "Database Analytics", href: "/admin/database", icon: Database },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card/50 backdrop-blur-xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 py-4 border-b border-primary/10 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <span className="font-bold text-lg tracking-tight">Admin Portal</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary text-muted-foreground"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <Button nativeButton={false} render={<Link href="/" />} variant="outline" className="w-full justify-start gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Button>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
