/**
 * Auth helpers for Supabase sign-in and backend-owned onboarding profile data.
 */

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { OnboardingSelection, UserSubtype, UserType } from "@/components/onboarding/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

type AuthProfileResponse = {
  id: string;
  email: string;
  name: string;
  user_type: UserType | null;
  user_subtype: UserSubtype | null;
  user_role: string | null;
  onboarding_required: boolean;
};

export type AuthApiUser = {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType | null;
  user_subtype: UserSubtype | null;
  user_role: string | null;
  onboarding_required: boolean;
  role_selection_complete: boolean;
};

function toAuthApiUser(profile: AuthProfileResponse): AuthApiUser {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.name,
    user_type: profile.user_type,
    user_subtype: profile.user_subtype,
    user_role: profile.user_role,
    onboarding_required: profile.onboarding_required,
    role_selection_complete: !profile.onboarding_required,
  };
}

async function fetchAuthProfile(accessToken: string): Promise<AuthApiUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load account profile (${response.status})`);
  }

  return toAuthApiUser((await response.json()) as AuthProfileResponse);
}

async function syncCurrentUserMetadata(profile: AuthApiUser): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  try {
    await supabase.auth.updateUser({
      data: {
        user_type: profile.user_type,
        user_subtype: profile.user_subtype,
        user_role: profile.user_role,
      },
    });
  } catch {
    // Backend profile remains source of truth even if metadata sync fails.
  }
}

export async function login(body: { email: string; password: string }): Promise<{
  access_token: string;
  user: AuthApiUser;
}> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Sign-in succeeded, but no active session is available.");
  }

  return {
    access_token: accessToken,
    user: await fetchAuthProfile(accessToken),
  };
}

export async function signup(body: {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
}): Promise<{
  access_token: string;
  user: AuthApiUser;
}> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: {
        name: body.full_name,
        full_name: body.full_name,
      },
      emailRedirectTo: `${window.location.origin}/authorized`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Account created. Please confirm your email, then sign in to continue.");
  }

  return {
    access_token: accessToken,
    user: await fetchAuthProfile(accessToken),
  };
}

export async function updateUserOnboardingSelection(
  selection: OnboardingSelection,
  token: string,
): Promise<AuthApiUser> {
  const response = await fetch(`${API_BASE}/auth/onboarding`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_type: selection.userType,
      user_subtype: selection.userSubtype,
    }),
  });

  if (!response.ok) {
    const fallbackMessage = `Unable to save onboarding details (${response.status})`;

    try {
      const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
      if (typeof payload.detail === "string") {
        throw new Error(payload.detail);
      }
      if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
        throw new Error(payload.detail[0].msg);
      }
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.message !== "") {
        throw caughtError;
      }
    }

    throw new Error(fallbackMessage);
  }

  const profile = toAuthApiUser((await response.json()) as AuthProfileResponse);
  await syncCurrentUserMetadata(profile);
  return profile;
}

export async function selectRole(body: { role: string }, token: string): Promise<AuthApiUser> {
  if (body.role === "client") {
    return updateUserOnboardingSelection({ userType: "client", userSubtype: "client" }, token);
  }

  throw new Error("Direct role selection is no longer supported without a subtype.");
}

export async function updateOnboarding(): Promise<void> {
  return Promise.resolve();
}
