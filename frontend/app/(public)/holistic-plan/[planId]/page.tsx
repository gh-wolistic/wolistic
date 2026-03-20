"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function LegacyHolisticPlanDetailRedirectPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const teamId = params?.planId;
    if (!teamId) {
      router.replace("/holistic-team");
      return;
    }
    router.replace(query ? `/holistic-team/${teamId}?${query}` : `/holistic-team/${teamId}`);
  }, [params, router, searchParams]);

  return null;
}
