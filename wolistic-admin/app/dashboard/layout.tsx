"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminApi } from "@/lib/admin-api-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | undefined>();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await adminApi.session.check();
        
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        setIsAuthenticated(true);
        setAdminEmail(session.email);

        // Fetch pending professional count for sidebar badge
        try {
          const professionals = await adminApi.professionals.list({ status: "pending", limit: 1 });
          setPendingCount(professionals.total);
        } catch (err) {
          console.error("Failed to fetch pending count:", err);
        }
      } catch (error) {
        // Silently redirect to login on auth check failure
        // This is expected behavior for unauthenticated users
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    void checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <AdminShell adminEmail={adminEmail} pendingCount={pendingCount}>
      {children}
    </AdminShell>
  );
}
