"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Loading from "@/app/loading";
import { AuthAppProvider } from "@/components/auth/AuthAppProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { DASHBOARD_V1_PATHS } from "@/components/dashboard/v1/routing";

function DashboardV2LayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthSession();

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

  return <>{children}</>;
}

export default function DashboardV2Layout({ children }: { children: ReactNode }) {
  return (
    <AuthAppProvider>
      <DashboardV2LayoutInner>{children}</DashboardV2LayoutInner>
    </AuthAppProvider>
  );
}
