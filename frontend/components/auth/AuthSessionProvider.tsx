"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { UserSubtype, UserType } from "@/components/onboarding/types";

export type AuthUserType = UserType | "unknown";

export type AuthSessionUser = {
  id: string;
  email: string;
  name: string;
  userType: AuthUserType;
  userSubtype: UserSubtype | null;
  userRole: string | null;
  onboardingRequired: boolean;
};

type ResolveUserProfile = (params: {
  accessToken: string;
  sessionUser: User;
}) => Promise<Partial<AuthSessionUser> | null>;

type AuthSessionContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  accessToken: string | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthSessionProviderProps = {
  children: ReactNode;
  resolveUserProfile?: ResolveUserProfile;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function normalizeUserType(value: unknown): AuthUserType {
  if (value === "client" || value === "partner") {
    return value;
  }

  return "unknown";
}

function normalizeUserSubtype(value: unknown): UserSubtype | null {
  if (
    value === "client" ||
    value === "body_expert" ||
    value === "mind_expert" ||
    value === "diet_expert" ||
    value === "mutiple_roles" ||
    value === "brand" ||
    value === "influencer"
  ) {
    return value;
  }

  return null;
}

function sessionUserToAuthUser(sessionUser: User): AuthSessionUser | null {
  if (!sessionUser.email) {
    return null;
  }

  const metadata = sessionUser.user_metadata ?? {};
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
      ? metadata.name
      : sessionUser.email.split("@")[0];

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: name.trim() || sessionUser.email.split("@")[0],
    userType: normalizeUserType(metadata.user_type),
    userSubtype: normalizeUserSubtype(metadata.user_subtype),
    userRole: typeof metadata.user_role === "string" ? metadata.user_role : null,
    onboardingRequired: !metadata.user_type || !metadata.user_subtype,
  };
}

export function AuthSessionProvider({ children, resolveUserProfile }: AuthSessionProviderProps) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);

  const hydrateFromSession = useCallback(
    async (session: Session | null) => {
      const requestId = ++loadRequestIdRef.current;

      if (!session?.user) {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        setUser(null);
        setAccessToken(null);
        setStatus("unauthenticated");
        return;
      }

      const baseUser = sessionUserToAuthUser(session.user);
      if (!baseUser) {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        setUser(null);
        setAccessToken(session.access_token ?? null);
        setStatus("unauthenticated");
        return;
      }

      let hydratedUser = baseUser;
      if (resolveUserProfile && session.access_token) {
        try {
          const profile = await resolveUserProfile({
            accessToken: session.access_token,
            sessionUser: session.user,
          });

          if (profile) {
            hydratedUser = {
              ...baseUser,
              ...profile,
              id: profile.id ?? baseUser.id,
              email: profile.email ?? baseUser.email,
              name: profile.name ?? baseUser.name,
              userType: profile.userType ? normalizeUserType(profile.userType) : baseUser.userType,
              userSubtype:
                profile.userSubtype === undefined
                  ? baseUser.userSubtype
                  : normalizeUserSubtype(profile.userSubtype),
              userRole: profile.userRole === undefined ? baseUser.userRole : profile.userRole,
              onboardingRequired:
                profile.onboardingRequired === undefined
                  ? baseUser.onboardingRequired
                  : profile.onboardingRequired,
            };
          }
        } catch {
          // Keep auth resilient if profile enrichment fails.
        }
      }

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      setUser(hydratedUser);
      setAccessToken(session.access_token ?? null);
      setStatus("authenticated");
    },
    [resolveUserProfile]
  );

  const refreshSession = useCallback(async () => {
    setStatus((current) => (current === "authenticated" ? current : "loading"));
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    await hydrateFromSession(data.session);
  }, [hydrateFromSession]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();

    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void (async () => {
      const { data } = await supabase.auth.getSession();
      await hydrateFromSession(data.session);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateFromSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated" && Boolean(user),
      user,
      accessToken,
      refreshSession,
      signOut,
    }),
    [accessToken, refreshSession, signOut, status, user]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
