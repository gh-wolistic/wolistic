"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Loading from "@/app/loading";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getDashboardV1Path } from "@/components/dashboard/v1/routing";

export default function DashboardV1RootPage() {
  const router = useRouter();
  const { status, user } = useAuthSession();

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      return;
    }

    const path = getDashboardV1Path({
      userType: user.userType,
      userSubtype: user.userSubtype,
    });

    router.replace(path ?? "/?onboarding=required");
  }, [router, status, user]);

  return <Loading />;
}
