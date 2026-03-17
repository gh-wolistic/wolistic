"use client";

import type { ReactNode } from "react";

import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { resolveAuthProfileFromBackend } from "@/components/auth/resolve-auth-profile";

export function AuthAppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthSessionProvider
      resolveUserProfile={({ accessToken }) =>
        resolveAuthProfileFromBackend({
          accessToken,
        })
      }
    >
      {children}
    </AuthSessionProvider>
  );
}
