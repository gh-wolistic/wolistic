"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PublicFooter } from "./PublicFooter";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PublicHeader } from "./PublicHeader";
import { AuthModalProvider, useAuthModal } from "@/components/auth/AuthModalProvider";

function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const user = null;

  const handleOpenAuth = useCallback(() => {
    openAuthModal();
  }, [openAuthModal]);

  const handleLogout = useCallback(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.signOut();
    router.push("/");
  }, [router]);

  const handleDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <PublicHeader
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onDashboard={handleDashboard}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

export function PublicLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <PublicLayoutShell>{children}</PublicLayoutShell>
    </AuthModalProvider>
  );
}
