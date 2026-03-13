"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { updateUserOnboardingSelection } from "@/components/public/data/authApi";
import { useSessionStore } from "@/store/session";
import { UserOnboardingFlow } from "./UserOnboardingFlow";
import {
  clearBookingFlowAutoClientSelection,
  hasBookingFlowAutoClientSelection,
} from "./storage";
import { mapUserProfileToDashboardRole, type OnboardingSelection } from "./types";

type UserOnboardingProviderProps = {
  children: ReactNode;
};

export function UserOnboardingProvider({ children }: UserOnboardingProviderProps) {
  const { status, user, accessToken, refreshSession } = useAuthSession();
  const setAuthSession = useSessionStore((state) => state.setAuthSession);
  const setRole = useSessionStore((state) => state.setRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAssignAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (status !== "authenticated" || !user?.onboardingRequired || !accessToken) {
      setIsOpen(false);
      setError(null);
      autoAssignAttemptedRef.current = false;
      return;
    }

    if (!autoAssignAttemptedRef.current && hasBookingFlowAutoClientSelection()) {
      autoAssignAttemptedRef.current = true;
      setIsSubmitting(true);
      setError(null);

      void (async () => {
        try {
          const profile = await updateUserOnboardingSelection(
            { userType: "client", userSubtype: "client" },
            accessToken,
          );

          setAuthSession({
            token: accessToken,
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.full_name,
              type: profile.user_type ?? undefined,
              userSubtype: profile.user_subtype,
              userRole: profile.user_role,
              onboardingRequired: profile.onboarding_required,
            },
          });
          setRole(mapUserProfileToDashboardRole(profile.user_type, profile.user_subtype));
          clearBookingFlowAutoClientSelection();
          await refreshSession();
          setIsOpen(false);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to save your profile right now.");
          setIsOpen(true);
        } finally {
          setIsSubmitting(false);
        }
      })();

      return;
    }

    setIsOpen(true);
  }, [accessToken, refreshSession, setAuthSession, setRole, status, user?.id, user?.onboardingRequired]);

  const handleSubmit = async (selection: OnboardingSelection) => {
    if (!accessToken || !user) {
      setError("Your session is no longer active. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profile = await updateUserOnboardingSelection(selection, accessToken);

      setAuthSession({
        token: accessToken,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          type: profile.user_type ?? undefined,
          userSubtype: profile.user_subtype,
          userRole: profile.user_role,
          onboardingRequired: profile.onboarding_required,
        },
      });
      setRole(mapUserProfileToDashboardRole(profile.user_type, profile.user_subtype));
      await refreshSession();
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save your profile right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children}
      {isOpen && user ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/55 px-3 py-3 backdrop-blur-sm md:px-6 md:py-6">
          <div className="mx-auto flex min-h-full w-full max-w-7xl items-start justify-center md:items-center">
            <UserOnboardingFlow
              userName={user.name}
              initialUserType={user.userType === "unknown" ? null : user.userType}
              initialUserSubtype={user.userSubtype}
              isSubmitting={isSubmitting}
              error={error}
              submitLabel="Save and Continue"
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}