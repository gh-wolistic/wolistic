"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Package, Users } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ProfessionalFeatureCard } from "@/components/public/cards/ProfessionalFeatureCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildHolisticTeamListCacheKey,
  getHolisticTeam,
  readHolisticTeamListCache,
} from "@/components/public/data/holisticTeamsApi";
import type { HolisticTeam } from "@/types/holistic-team";
import type { ProfessionalProfile } from "@/types/professional";

export default function HolisticTeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthSession();
  const { openAuthSidebar } = useAuthModal();

  const teamId = params?.teamId;
  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "professionals";
  const mode = searchParams.get("mode") ?? "";
  const minPrice = Number.parseFloat(searchParams.get("minPrice") ?? "");
  const maxPrice = Number.parseFloat(searchParams.get("maxPrice") ?? "");

  const minPriceFilter = Number.isFinite(minPrice) ? minPrice : undefined;
  const maxPriceFilter = Number.isFinite(maxPrice) ? maxPrice : undefined;

  const cacheKey = useMemo(
    () =>
      buildHolisticTeamListCacheKey({
        q: query,
        scope,
        sort: "recommended",
        mode: mode || undefined,
        minPrice: minPriceFilter,
        maxPrice: maxPriceFilter,
      }),
    [maxPriceFilter, minPriceFilter, mode, query, scope],
  );

  const [team, setTeam] = useState<HolisticTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!teamId) {
        setTeam(null);
        setIsLoading(false);
        return;
      }

      const cached = readHolisticTeamListCache(cacheKey);
      const cachedMatch = cached?.find((item) => item.id === teamId) ?? null;

      if (cachedMatch && !cancelled) {
        setTeam(cachedMatch);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setError(null);
      try {
        const payload = await getHolisticTeam(teamId);
        if (!cancelled) {
          setTeam(payload);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to load team details.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, teamId]);

  const summaryHref = useMemo(() => {
    const context = new URLSearchParams();
    if (query.trim()) {
      context.set("q", query.trim());
    }
    if (scope) {
      context.set("scope", scope);
    }
    const str = context.toString();
    return str ? `/holistic-team?${str}` : "/holistic-team";
  }, [query, scope]);

  const requireLogin = (nextHref: string) => {
    if (isAuthenticated) {
      router.push(nextHref);
      return;
    }
    openAuthSidebar({
      redirectNextPath: nextHref,
      title: "Sign in to continue",
      description: "Your team selection is ready and waiting.",
      onAuthenticated: () => {
        router.push(nextHref);
      },
    });
  };

  const handleBookTeam = () => {
    if (!team) {
      return;
    }
    requireLogin(`/payment-status?teamId=${team.id}`);
  };

  const buildMemberServicesHref = (member: HolisticTeam["members"][number]) => {
    const username = member.professional.username?.trim();
    if (username) {
      return `/${username}#services`;
    }
    const q = encodeURIComponent(member.professional.name || member.professional.specialization || "expert");
    return `/results?scope=professionals&q=${q}`;
  };

  const goToMemberServices = (member: HolisticTeam["members"][number]) => {
    router.push(buildMemberServicesHref(member));
  };

  const toCardProfile = (teamMember: HolisticTeam["members"][number]): ProfessionalProfile => ({
    id: teamMember.professional.id,
    username: teamMember.professional.username,
    name: teamMember.professional.name,
    specialization: teamMember.professional.specialization,
    category: teamMember.professional.category,
    location: teamMember.professional.location,
    image: teamMember.professional.image,
    rating: teamMember.professional.rating,
    reviewCount: teamMember.professional.reviewCount,
    experienceYears: teamMember.professional.experienceYears || 0,
    membershipTier: teamMember.professional.membershipTier,
    profileCompleteness: 0,
    isOnline: teamMember.professional.isOnline,
    certifications: [],
    specializations: [],
    education: [],
    languages: [],
    sessionTypes: [],
    subcategories: [],
    gallery: [],
    services: [],
    featuredProducts: [],
  });

  return (
    <div className="w-full bg-background min-h-screen py-10 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ArrowLeft size={16} />
          <Link href={summaryHref} className="hover:text-foreground font-medium">
            Back to team listings
          </Link>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading team details...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && !team && (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Team not found.</div>
        )}

        {team && (
          <div className="rounded-2xl border border-border bg-white dark:bg-slate-950/70 dark:border-slate-800 p-6 lg:p-8 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Holistic Team</p>
                <h1 className="text-2xl lg:text-3xl font-semibold leading-tight text-foreground">{team.name || "Holistic team"}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{team.members.length} members</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">
                    {team.sourceType === "member_collab" ? "Member collaboration" : "Engine generated"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 w-full lg:w-auto">
                <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/60 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package size={16} className="text-emerald-600" />
                    Team price
                  </div>
                  <p className="text-xl font-semibold text-foreground">{team.pricingCurrency} {team.pricingAmount.toLocaleString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button className="bg-linear-to-r from-emerald-500 to-teal-600 text-white" onClick={handleBookTeam}>
                    {isAuthenticated ? "Book this team" : "Login to select team"}
                  </Button>
                  <Button variant="outline" onClick={() => requireLogin(`/holistic-team/create?q=${encodeURIComponent(query)}`)}>
                    I want to create my own team
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/70 p-4 space-y-2">
                <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40">
                    <CalendarClock size={16} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Mode / package</p>
                    <p className="text-sm text-foreground capitalize">{team.mode} · {team.packageType.replaceAll("_", " ")}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Includes {team.sessionsIncludedTotal} total sessions</p>
              </div>

              <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/70 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={16} className="text-emerald-600" />
                  Keywords
                </div>
                <div className="flex flex-wrap gap-2">
                  {(team.keywords.length ? team.keywords : ["general wellness"]).map((keyword) => (
                    <Badge key={keyword} variant="outline" className="capitalize">{keyword}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-slate-50/40 dark:bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users size={16} className="text-emerald-600" />
                Team members
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {team.members.map((member) => (
                  <ProfessionalFeatureCard
                    key={`${team.id}-${member.professional.id}`}
                    professional={toCardProfile(member)}
                    roleOverride={member.role}
                    ctaLabel="Book Individual expert"
                    onCtaClick={() => goToMemberServices(member)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
