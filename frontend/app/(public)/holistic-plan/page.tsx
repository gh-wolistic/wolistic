"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyHolisticPlanRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.replace(query ? `/holistic-team?${query}` : "/holistic-team");
  }, [router, searchParams]);

  return null;
}
