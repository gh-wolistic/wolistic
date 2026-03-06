/**
 * Stub – session store (Zustand).
 * Placeholder until the full auth flow is wired up.
 */

import { create } from "zustand";
import type { DashboardRole } from "@/types/dashboard";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  type?: string;
  onboardingComplete?: boolean;
  accountType?: string;
  expertType?: string;
  expertSubtype?: string;
  roleStatus?: string;
  onboardingStatus?: string;
  roleSelectionComplete?: boolean;
};

type SessionState = {
  token: string | null;
  user: SessionUser | null;
  role: DashboardRole | null;
  setAuthSession: (payload: { user: SessionUser; token: string }) => void;
  setRole: (role: DashboardRole) => void;
  setOnboardingComplete: (val: boolean) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  role: null,
  setAuthSession: ({ user, token }) => set({ user, token }),
  setRole: (role) => set({ role }),
  setOnboardingComplete: (val) =>
    set((s) => (s.user ? { user: { ...s.user, onboardingComplete: val } } : {})),
  clearSession: () => set({ token: null, user: null, role: null }),
}));
