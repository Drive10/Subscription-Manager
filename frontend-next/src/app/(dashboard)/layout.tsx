"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Don't show sidebar on auth pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:pl-64">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </main>
      </div>
      <footer className="border-t bg-card py-4 md:pl-64">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} SubKeep</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}