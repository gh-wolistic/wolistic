"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/app/loading";
import { AuthAppProvider } from "@/components/auth/AuthAppProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { DASHBOARD_V1_PATHS, getDashboardV1Path } from "@/components/dashboard/v1/routing";

function getSafeNextPath(rawNext: string | null): string | null {
  if (!rawNext) {
    return null;
  }

  const value = rawNext.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value === "/authorized" || value.startsWith("/authorized?")) {
    return null;
  }

  return value;
}

function AuthorizedGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment_status");
  const nextPath = getSafeNextPath(searchParams.get("next"));
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

    if (user.userType === "partner" && user.userStatus === "suspended") {
      router.replace(DASHBOARD_V1_PATHS.suspended);
      return;
    }

    const dashboardPath = getDashboardV1Path({
      userType: user.userType,
      userSubtype: user.userSubtype,
    });

    if (!dashboardPath) {
      router.replace("/?onboarding=required");
      return;
    }

    if (paymentStatus) {
      router.replace(`${dashboardPath}?payment_status=${encodeURIComponent(paymentStatus)}`);
      return;
    }

    if (nextPath) {
      router.replace(nextPath);
      return;
    }

    router.replace(dashboardPath);
  }, [nextPath, paymentStatus, router, status, user]);

  return <Loading />;
}

export default function AuthorizedPage() {
  return (
    <AuthAppProvider>
      <AuthorizedGate />
    </AuthAppProvider>
  );
}
