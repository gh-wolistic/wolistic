"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { BackToTopButton } from "./BackToTopButton";
import { AuthModalProvider, useAuthModal } from "@/components/auth/AuthModalProvider";
import { AuthSessionProvider, useAuthSession } from "@/components/auth/AuthSessionProvider";
import { UserOnboardingProvider } from "@/components/onboarding/UserOnboardingProvider";
import { resolveAuthProfileFromBackend } from "@/components/auth/resolve-auth-profile";

function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const { user, signOut } = useAuthSession();

  const handleOpenAuth = useCallback(() => {
    openAuthModal();
  }, [openAuthModal]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [router, signOut]);

  const headerUser = user
    ? {
        name: user.name,
        email: user.email,
        type: user.userType === "unknown" ? "client" : user.userType,
      }
    : null;

  const handleDashboard = useCallback(() => {
    router.push("/authorized");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <PublicHeader
        user={headerUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onDashboard={handleDashboard}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <BackToTopButton />
    </div>
  );
}

export function PublicLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider
      resolveUserProfile={({ accessToken }) =>
        resolveAuthProfileFromBackend({
          accessToken,
        })
      }
    >
      <AuthModalProvider>
        <UserOnboardingProvider>
          <PublicLayoutShell>{children}</PublicLayoutShell>
        </UserOnboardingProvider>
      </AuthModalProvider>
    </AuthSessionProvider>
  );
}
