"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Body Expert dashboard has moved to the v2 Elite shell. */
export default function BodyExpertV1Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/v2/partner/body-expert"); }, [router]);
  return null;
}
