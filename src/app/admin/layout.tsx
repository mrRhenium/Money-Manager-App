import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not admin, show an unauthorized UI wrapped in the MainLayout so they still see the sidebar
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Access Denied</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            You do not have the necessary administrator permissions to view this section. If you believe this is an error, please contact support.
          </p>
          <Button nativeButton={false} render={<Link href="/" />} className="rounded-full px-6 shadow-md hover:scale-105 transition-transform">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
