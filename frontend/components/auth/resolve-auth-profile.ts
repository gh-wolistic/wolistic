"use client";

import type { AuthSessionUser } from "@/components/auth/AuthSessionProvider";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type BackendProfileResponse = {
  id?: string;
  email?: string;
  name?: string;
  user_type?: string;
  user_role?: string | null;
};

// Optional resolver to enrich session user with backend-owned profile fields.
export async function resolveAuthProfileFromBackend(params: {
  accessToken: string;
}): Promise<Partial<AuthSessionUser> | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BackendProfileResponse;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    userType: data.user_type as AuthSessionUser["userType"],
    userRole: data.user_role,
  };
}
