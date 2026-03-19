"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getProfessionalEditorPayload } from "@/components/dashboard/profile/profileEditorApi";

export default function ViewAsPublicRedirectPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthSession();

  useEffect(() => {
    if (!user?.id || !accessToken) {
      router.replace("/results?scope=professionals");
      return;
    }

    void (async () => {
      try {
        const profile = await getProfessionalEditorPayload(accessToken);
        if (profile.username) {
          router.replace(`/${profile.username}`);
          return;
        }
      } catch {
        // Keep redirect resilient.
      }

      router.replace("/results?scope=professionals");
    })();
  }, [accessToken, router, user?.id]);

  return <p className="text-sm text-zinc-600">Opening your public profile preview...</p>;
}
