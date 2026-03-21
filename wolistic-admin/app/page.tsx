"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AdminStatusFilter = "pending" | "verified" | "suspended" | "all";
type AdminMembershipTier = "basic" | "premium" | "elite";

type ProfessionalItem = {
  id: string;
  email: string;
  full_name: string | null;
  user_subtype: string | null;
  user_status: "pending" | "verified" | "suspended";
  created_at: string;
  profile: {
    username: string | null;
    specialization: string | null;
    membership_tier: string | null;
    profile_completeness: number;
    location: string | null;
    has_profile: boolean;
  };
};

type ProfessionalListResponse = {
  items: ProfessionalItem[];
  total: number;
};

type BulkApproveResponse = {
  requested: number;
  approved: number;
  min_profile_completeness: number;
};

const FILTERS: AdminStatusFilter[] = ["pending", "verified", "suspended", "all"];
const TIER_ORDER: AdminMembershipTier[] = ["basic", "premium", "elite"];

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTier(tier: string | null | undefined): AdminMembershipTier {
  const value = String(tier || "").trim().toLowerCase();
  if (value === "premium" || value === "elite") {
    return value;
  }
  return "basic";
}

export default function Home() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("pending");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkThreshold, setBulkThreshold] = useState(90);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [activeRowAction, setActiveRowAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setIsCheckingSession(true);
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!response.ok) {
        setIsAuthenticated(false);
        setAdminEmail("");
        return;
      }

      const data = (await response.json()) as { authenticated: boolean; email?: string };
      setIsAuthenticated(data.authenticated);
      setAdminEmail(data.email || "");
      if (data.email) {
        setEmail(data.email);
      }
    } catch {
      setIsAuthenticated(false);
      setAdminEmail("");
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  const loadProfessionals = useCallback(
    async (filter: AdminStatusFilter) => {
      setIsLoadingList(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/professionals?status=${filter}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as ProfessionalListResponse | { detail?: string };

        if (!response.ok) {
          throw new Error(
            typeof data === "object" && data && "detail" in data
              ? data.detail || "Failed to load professionals"
              : "Failed to load professionals"
          );
        }

        setProfessionals((data as ProfessionalListResponse).items);
        setTotal((data as ProfessionalListResponse).total);
      } catch (loadError) {
        setProfessionals([]);
        setTotal(0);
        setError(loadError instanceof Error ? loadError.message : "Failed to load professionals");
      } finally {
        setIsLoadingList(false);
      }
    },
    []
  );

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void loadProfessionals(statusFilter);
  }, [isAuthenticated, statusFilter, loadProfessionals]);

  const visibleProfessionals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return professionals;
    }

    return professionals.filter((item) => {
      const haystack = [
        item.full_name,
        item.email,
        item.profile.username,
        item.profile.specialization,
        item.profile.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [professionals, searchQuery]);

  const pendingCount = useMemo(
    () => professionals.filter((item) => item.user_status === "pending").length,
    [professionals]
  );

  const eligibleBulkIds = useMemo(
    () =>
      visibleProfessionals
        .filter((item) => {
          const completeness = Math.max(0, Math.min(100, Number(item.profile.profile_completeness || 0)));
          return item.user_status === "pending" && item.profile.has_profile && completeness >= bulkThreshold;
        })
        .map((item) => item.id),
    [visibleProfessionals, bulkThreshold]
  );

  const onLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { detail?: string; email?: string };

      if (!response.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      setIsAuthenticated(true);
      setAdminEmail(data.email || email);
      setPassword("");
      await loadProfessionals(statusFilter);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAdminEmail("");
    setProfessionals([]);
    setTotal(0);
    setPassword("");
  };

  const updateStatus = async (userId: string, action: "approve" | "suspend") => {
    setActiveRowAction(`${action}:${userId}`);
    setError(null);

    try {
      const response = await fetch(`/api/admin/professionals/${userId}/${action}`, {
        method: "POST",
      });
      const data = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(data.detail || "Action failed");
      }
      await loadProfessionals(statusFilter);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update status");
    } finally {
      setActiveRowAction(null);
    }
  };

  const updateTier = async (userId: string, nextTier: AdminMembershipTier) => {
    setActiveRowAction(`tier:${nextTier}:${userId}`);
    setError(null);

    try {
      const response = await fetch(`/api/admin/professionals/${userId}/tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: nextTier }),
      });
      const data = (await response.json()) as { detail?: string };
      if (!response.ok) {
        throw new Error(data.detail || "Failed to update tier");
      }
      await loadProfessionals(statusFilter);
    } catch (tierError) {
      setError(tierError instanceof Error ? tierError.message : "Failed to update tier");
    } finally {
      setActiveRowAction(null);
    }
  };

  const bulkApproveByCompletedness = async () => {
    if (eligibleBulkIds.length === 0) {
      return;
    }

    const shouldProceed = window.confirm(
      `Approve ${eligibleBulkIds.length} professionals with completedness >= ${bulkThreshold}%?`
    );

    if (!shouldProceed) {
      return;
    }

    setIsBulkApproving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/professionals/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: eligibleBulkIds, minProfileCompleteness: bulkThreshold }),
      });
      const data = (await response.json()) as BulkApproveResponse | { detail?: string };
      if (!response.ok) {
        throw new Error(typeof data === "object" && data && "detail" in data ? data.detail || "Bulk approve failed" : "Bulk approve failed");
      }
      await loadProfessionals(statusFilter);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Failed to bulk approve professionals");
    } finally {
      setIsBulkApproving(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="animate-pulse text-sm tracking-[0.24em] uppercase text-slate-400">Loading control room</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-44 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Wolistic</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Super Admin Access</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to approve pending professionals and manage platform quality.</p>

          <form className="mt-8 space-y-4" onSubmit={onLogin}>
            <label className="block text-sm text-slate-300">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-slate-100 outline-none transition focus:border-cyan-400"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 to-slate-800 p-6 shadow-2xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Super Admin</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Professional Approval Dashboard</h1>
              <p className="mt-2 text-sm text-slate-300">
                Logged in as <span className="font-medium text-cyan-300">{adminEmail}</span>
              </p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-300 hover:text-rose-200"
            >
              Sign Out
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Queue</p>
              <p className="mt-2 text-2xl font-semibold">{pendingCount}</p>
              <p className="text-sm text-slate-300">Pending approvals</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current View</p>
              <p className="mt-2 text-2xl font-semibold">{visibleProfessionals.length}</p>
              <p className="text-sm text-slate-300">Visible professionals</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-semibold">{total}</p>
              <p className="text-sm text-slate-300">Records returned by backend</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const selected = statusFilter === filter;
              return (
                <button
                  key={filter}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "bg-cyan-400 text-slate-900"
                      : "border border-white/15 bg-slate-900 text-slate-200 hover:border-cyan-400/50"
                  }`}
                  onClick={() => setStatusFilter(filter)}
                >
                  {toTitleCase(filter)}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 sm:w-72"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, username"
            />
            <button
              className="rounded-lg border border-white/15 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300"
              onClick={() => void loadProfessionals(statusFilter)}
              disabled={isLoadingList}
            >
              {isLoadingList ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1 text-sm text-cyan-100">
            <p className="font-medium">Bulk Approve by Completedness</p>
            <p className="text-xs text-cyan-200/80">
              Eligible in current view: {eligibleBulkIds.length} pending profiles at or above {bulkThreshold}%.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-cyan-100">
              Threshold
              <input
                className="w-24 rounded-lg border border-cyan-300/30 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300"
                type="number"
                min={0}
                max={100}
                value={bulkThreshold}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) {
                    setBulkThreshold(Math.max(0, Math.min(100, next)));
                  }
                }}
              />
            </label>

            <button
              className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void bulkApproveByCompletedness()}
              disabled={isLoadingList || isBulkApproving || eligibleBulkIds.length === 0}
            >
              {isBulkApproving ? "Approving in bulk..." : `Approve all >= ${bulkThreshold}%`}
            </button>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-xl border border-rose-300/30 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p> : null}

        <div className="space-y-3">
          {isLoadingList ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-sm text-slate-400">Loading professionals...</div>
          ) : visibleProfessionals.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-sm text-slate-400">No professionals found for this filter.</div>
          ) : (
            visibleProfessionals.map((item) => {
              const currentTier = normalizeTier(item.profile.membership_tier);
              const currentTierIndex = TIER_ORDER.indexOf(currentTier);
              const upgradeTier = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
              const downgradeTier = currentTierIndex > 0 ? TIER_ORDER[currentTierIndex - 1] : null;
              const completeness = Math.max(0, Math.min(100, Number(item.profile.profile_completeness || 0)));

              const approving = activeRowAction === `approve:${item.id}`;
              const suspending = activeRowAction === `suspend:${item.id}`;
              const upgrading = upgradeTier ? activeRowAction === `tier:${upgradeTier}:${item.id}` : false;
              const downgrading = downgradeTier ? activeRowAction === `tier:${downgradeTier}:${item.id}` : false;
              const rowBusy = approving || suspending || upgrading || downgrading;

              return (
                <article
                  key={item.id}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-slate-900 p-4 md:grid-cols-[1.7fr_1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{item.full_name || item.email}</h2>
                      <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-300">{item.user_status}</span>
                      {item.profile.has_profile ? (
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-300">Profile ready</span>
                      ) : (
                        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs text-amber-200">Missing profile</span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-400">{item.email}</p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                      <span>Subtype: {item.user_subtype ? toTitleCase(item.user_subtype) : "-"}</span>
                      <span>Username: {item.profile.username || "-"}</span>
                      <span>Specialization: {item.profile.specialization || "-"}</span>
                      <span>Location: {item.profile.location || "-"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-center">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Tier</p>
                      <p className="mt-1 text-sm text-slate-200">{currentTier}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500">Completedness</p>
                      <p className="mt-1 text-sm text-slate-200">{completeness}%</p>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 md:flex-col">
                    <button
                      className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                      disabled={rowBusy || item.user_status === "verified"}
                      onClick={() => void updateStatus(item.id, "approve")}
                    >
                      {approving ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="rounded-lg border border-rose-400/60 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                      disabled={rowBusy || item.user_status === "suspended"}
                      onClick={() => void updateStatus(item.id, "suspend")}
                    >
                      {suspending ? "Suspending..." : "Suspend"}
                    </button>
                    <button
                      className="rounded-lg border border-cyan-300/60 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                      disabled={rowBusy || !item.profile.has_profile || !upgradeTier}
                      onClick={() => {
                        if (upgradeTier) {
                          void updateTier(item.id, upgradeTier);
                        }
                      }}
                    >
                      {upgrading ? "Upgrading..." : upgradeTier ? `Upgrade to ${toTitleCase(upgradeTier)}` : "At highest tier"}
                    </button>
                    <button
                      className="rounded-lg border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
                      disabled={rowBusy || !item.profile.has_profile || !downgradeTier}
                      onClick={() => {
                        if (downgradeTier) {
                          void updateTier(item.id, downgradeTier);
                        }
                      }}
                    >
                      {downgrading ? "Downgrading..." : downgradeTier ? `Downgrade to ${toTitleCase(downgradeTier)}` : "At lowest tier"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
