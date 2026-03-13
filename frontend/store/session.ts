/**
 * Stub – session store (Zustand).
 * Placeholder until the full auth flow is wired up.
 */

import { create } from "zustand";
import type { DashboardRole } from "@/types/dashboard";
import type { UserSubtype, UserType } from "@/components/onboarding/types";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  type?: UserType;
  userSubtype?: UserSubtype | null;
  userRole?: string | null;
  onboardingRequired?: boolean;
  onboardingComplete?: boolean;
};

type SessionState = {
  token: string | null;
  user: SessionUser | null;
  role: DashboardRole | null;
  setAuthSession: (payload: { user: SessionUser; token: string }) => void;
  updateUser: (payload: Partial<SessionUser>) => void;
  setRole: (role: DashboardRole) => void;
  setOnboardingComplete: (val: boolean) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  role: null,
  setAuthSession: ({ user, token }) => set({ user, token }),
  updateUser: (payload) => set((state) => (state.user ? { user: { ...state.user, ...payload } } : {})),
  setRole: (role) => set({ role }),
  setOnboardingComplete: (val) =>
    set((s) => (s.user ? { user: { ...s.user, onboardingComplete: val } } : {})),
  clearSession: () => set({ token: null, user: null, role: null }),
}));
