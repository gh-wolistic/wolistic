"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Mail, Search, UserPlus } from "lucide-react";

import { createHolisticTeam } from "@/components/public/data/holisticTeamsApi";
import { searchProfessionals } from "@/components/public/data/professionalsApi";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";

type TeamRole = "body" | "mind" | "diet";

type MemberOption = {
  id: string;
  username: string;
  name: string;
  specialization?: string;
};

type MemberRow = {
  role: TeamRole;
  query: string;
  selected: MemberOption | null;
};

export default function CreateHolisticTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isAuthenticated, status } = useAuthSession();
  const { openAuthSidebar } = useAuthModal();

  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "professionals";

  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState(query.trim());
  const [mode, setMode] = useState("online");
  const [memberRows, setMemberRows] = useState<MemberRow[]>([
    { role: "body", query: "", selected: null },
    { role: "mind", query: "", selected: null },
    { role: "diet", query: "", selected: null },
  ]);
  const [searchResultsByIndex, setSearchResultsByIndex] = useState<Record<number, MemberOption[]>>({});
  const [searchingByIndex, setSearchingByIndex] = useState<Record<number, boolean>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const latestSearchRunByIndex = useRef<Record<number, number>>({});

  const parsedKeywords = useMemo(
    () => keywords.split(",").map((item) => item.trim()).filter(Boolean),
    [keywords],
  );

  const contextSearch = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (scope) {
      params.set("scope", scope);
    }
    const serialized = params.toString();
    return serialized ? `?${serialized}` : "";
  }, [query, scope]);

  const roleLabel = (role: TeamRole) => role.charAt(0).toUpperCase() + role.slice(1);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isAuthenticated) {
      const nextPath = `/holistic-team/create${contextSearch}`;
      openAuthSidebar({
        redirectNextPath: nextPath,
        title: "Sign in to create a team",
        description: "You need an account before inviting experts.",
        onAuthenticated: () => {
          router.replace(nextPath);
        },
      });
    }
  }, [contextSearch, isAuthenticated, openAuthSidebar, router, status]);

  const updateRow = (index: number, patch: Partial<MemberRow>) => {
    setMemberRows((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const searchMember = async (index: number, rawValue: string) => {
    updateRow(index, { query: rawValue, selected: null });

    const value = rawValue.trim();
    if (value.length < 2) {
      setSearchResultsByIndex((previous) => ({ ...previous, [index]: [] }));
      return;
    }

    const runId = (latestSearchRunByIndex.current[index] || 0) + 1;
    latestSearchRunByIndex.current[index] = runId;

    setSearchingByIndex((previous) => ({ ...previous, [index]: true }));

    try {
      const matches = await searchProfessionals(value, 8);
      if (latestSearchRunByIndex.current[index] !== runId) {
        return;
      }

      setSearchResultsByIndex((previous) => ({
        ...previous,
        [index]: matches.map((profile) => ({
          id: profile.id,
          username: profile.username,
          name: profile.name,
          specialization: profile.specialization,
        })),
      }));
    } catch {
      if (latestSearchRunByIndex.current[index] !== runId) {
        return;
      }
      setSearchResultsByIndex((previous) => ({ ...previous, [index]: [] }));
    } finally {
      if (latestSearchRunByIndex.current[index] === runId) {
        setSearchingByIndex((previous) => ({ ...previous, [index]: false }));
      }
    }
  };

  const selectMember = (index: number, option: MemberOption) => {
    updateRow(index, {
      selected: option,
      query: `${option.name} (@${option.username})`,
    });
    setSearchResultsByIndex((previous) => ({ ...previous, [index]: [] }));
  };

  const inviteProfessional = () => {
    setError(null);
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email to send an invite.");
      return;
    }

    const subject = encodeURIComponent("Join my Wolistic team collaboration");
    const body = encodeURIComponent(
      `Hi, I am creating a team on Wolistic and would like to invite you as an expert.${query.trim() ? `\n\nUse case: ${query.trim()}` : ""}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setInvitedEmails((previous) => (previous.includes(email) ? previous : [...previous, email]));
    setInviteEmail("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isAuthenticated || !accessToken) {
      const nextPath = `/holistic-team/create${contextSearch}`;
      openAuthSidebar({
        redirectNextPath: nextPath,
        title: "Sign in to create a team",
        description: "You need an account before inviting experts.",
        onAuthenticated: () => {
          router.replace(nextPath);
        },
      });
      return;
    }

    const members = memberRows
      .map((row) => ({
        professionalId: row.selected?.id || "",
        role: row.role,
        sessionsIncluded: 1,
      }))
      .filter((row) => row.professionalId);

    if (members.length !== 3) {
      setError("Select exactly 3 members: one each for body, mind, and diet.");
      return;
    }

    if (new Set(members.map((item) => item.professionalId)).size !== 3) {
      setError("Each role must have a different professional.");
      return;
    }

    if (parsedKeywords.length === 0) {
      setError("Add at least one keyword.");
      return;
    }

    setSubmitting(true);
    try {
      const team = await createHolisticTeam(
        {
          name: name.trim() || undefined,
          scope,
          keywords: parsedKeywords,
          mode,
          packageType: "consultation_only",
          pricingAmount: 0,
          pricingCurrency: "INR",
          members,
        },
        accessToken,
      );
      router.replace(`/holistic-team/${team.id}?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`);
    } catch (err) {
      console.error(err);
      setError("Unable to create team. Check professional IDs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="mb-5">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              router.push(`/holistic-team${contextSearch}`);
            }}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-semibold">Create your own team collaboration</h1>
          <p className="text-sm text-muted-foreground">Pick one expert each for body, mind, and diet. Search by name or username.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white dark:bg-slate-950/60 p-4 sm:p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium">Team name (optional)</label>
            <input className="w-full h-10 rounded-md border px-3 bg-background" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Keywords (comma separated)</label>
            <input className="w-full h-10 rounded-md border px-3 bg-background" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="diet, adhd, stress" />
          </div>

          <div className="grid sm:grid-cols-1 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mode</label>
              <select className="w-full h-10 rounded-md border px-3 bg-background" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Members</p>
            {memberRows.map((row, index) => (
              <div key={`member-${index}`} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-7 items-center rounded-full bg-emerald-50 px-3 text-xs font-medium text-emerald-700 capitalize dark:bg-emerald-900/30 dark:text-emerald-200">
                    {roleLabel(row.role)}
                  </span>
                  {row.selected && (
                    <span className="inline-flex items-center text-xs text-emerald-700 dark:text-emerald-300">
                      <Check size={14} className="mr-1" /> Selected
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-full rounded-md border pl-9 pr-3 bg-background"
                    value={row.query}
                    onChange={(e) => {
                      void searchMember(index, e.target.value);
                    }}
                    placeholder="Search by name or username"
                  />
                </div>

                {searchingByIndex[index] && (
                  <p className="text-xs text-muted-foreground">Searching experts...</p>
                )}

                {(searchResultsByIndex[index] || []).length > 0 && (
                  <div className="max-h-44 overflow-auto rounded-md border border-border bg-background">
                    {(searchResultsByIndex[index] || []).map((option) => (
                      <button
                        key={`${row.role}-${option.id}`}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b border-border last:border-b-0"
                        onClick={() => selectMember(index, option)}
                      >
                        <p className="text-sm font-medium">{option.name}</p>
                        <p className="text-xs text-muted-foreground">@{option.username}{option.specialization ? ` - ${option.specialization}` : ""}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserPlus size={16} />
              Invite professional by email if not found
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                className="h-10 flex-1 rounded-md border px-3 bg-background"
                placeholder="expert@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={inviteProfessional}>
                <Mail size={14} className="mr-2" />
                Invite
              </Button>
            </div>
            {invitedEmails.length > 0 && (
              <p className="text-xs text-muted-foreground">Invited: {invitedEmails.join(", ")}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-linear-to-r from-emerald-500 to-teal-600 text-white">
            {submitting ? "Creating..." : "Create team"}
          </Button>
        </form>
      </div>
    </div>
  );
}
