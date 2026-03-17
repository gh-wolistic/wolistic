"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Loading from "@/app/loading";
import { AuthAppProvider } from "@/components/auth/AuthAppProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { DashboardShell } from "@/components/dashboard/v1/DashboardShell";
import { getDashboardNavSections } from "@/components/dashboard/v1/navigation";
import { DASHBOARD_V1_PATHS } from "@/components/dashboard/v1/routing";

function DashboardV1LayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, signOut } = useAuthSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" || !user) {
      router.replace("/");
      return;
    }

    if (user.userType === "unknown" || !user.userSubtype) {
      router.replace("/?onboarding=required");
      return;
    }

    if (user.userStatus === "suspended" && pathname !== DASHBOARD_V1_PATHS.suspended) {
      router.replace(DASHBOARD_V1_PATHS.suspended);
    }
  }, [pathname, router, status, user]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated" || !user) {
    return <Loading />;
  }

  if (user.userType === "unknown" || !user.userSubtype) {
    return <Loading />;
  }

  const sections = getDashboardNavSections(user);

  return (
    <DashboardShell user={user} sections={sections} onSignOut={signOut}>
      {children}
    </DashboardShell>
  );
}

export default function DashboardV1Layout({ children }: { children: ReactNode }) {
  return (
    <AuthAppProvider>
      <DashboardV1LayoutInner>{children}</DashboardV1LayoutInner>
    </AuthAppProvider>
  );
}
