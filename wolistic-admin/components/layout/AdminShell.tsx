"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { adminApi } from "@/lib/admin-api-client";

interface AdminShellProps {
  children: React.ReactNode;
  adminEmail?: string;
  pendingCount?: number;
}

export function AdminShell({ children, adminEmail, pendingCount }: AdminShellProps) {
  const [ mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await adminApi.session.logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar pendingCount={pendingCount} />
      </div>

      {/* Mobile Sidebar (Simple Overlay - TODO: Replace with Sheet when Radix UI is fixed) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeMobileNav}
          />
          <div className="relative w-64">
            <AdminSidebar pendingCount={pendingCount} onNavigate={closeMobileNav} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          adminEmail={adminEmail}
          onMenuClick={() => setMobileNavOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
