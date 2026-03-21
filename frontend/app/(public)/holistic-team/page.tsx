"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Package, SlidersHorizontal } from "lucide-react";

import { ProfessionalFeatureCard } from "@/components/public/cards/ProfessionalFeatureCard";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildHolisticTeamListCacheKey,
  listHolisticTeams,
  readHolisticTeamListCache,
  writeHolisticTeamListCache,
} from "@/components/public/data/holisticTeamsApi";
import type { HolisticTeam } from "@/types/holistic-team";
import type { ProfessionalProfile } from "@/types/professional";

export default function HolisticTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthSession();

  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "professionals";
  const modeFromParams = (searchParams.get("mode") ?? "").trim().toLowerCase();
  const minPriceFromParams = Number.parseFloat(searchParams.get("minPrice") ?? "");
  const maxPriceFromParams = Number.parseFloat(searchParams.get("maxPrice") ?? "");

  const [teams, setTeams] = useState<HolisticTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRelaxedFilters, setHasRelaxedFilters] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [modeFilter, setModeFilter] = useState(
    ["online", "offline", "hybrid"].includes(modeFromParams) ? modeFromParams : "",
  );
  const [packageTypeFilter, setPackageTypeFilter] = useState("");

  const minPriceFilter = Number.isFinite(minPriceFromParams) ? minPriceFromParams : undefined;
  const maxPriceFilter = Number.isFinite(maxPriceFromParams) ? maxPriceFromParams : undefined;

  const matchesPreferences = useCallback((team: HolisticTeam) => {
    const normalizedMode = modeFilter.trim().toLowerCase();
    if (normalizedMode && team.mode !== normalizedMode) {
      return false;
    }
    if (typeof minPriceFilter === "number" && team.pricingAmount < minPriceFilter) {
      return false;
    }
    if (typeof maxPriceFilter === "number" && team.pricingAmount > maxPriceFilter) {
      return false;
    }
    return true;
  }, [maxPriceFilter, minPriceFilter, modeFilter]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const requestInput = {
        q: query,
        scope,
        sort,
        mode: modeFilter || undefined,
        packageType: packageTypeFilter || undefined,
        minPrice: minPriceFilter,
        maxPrice: maxPriceFilter,
      };

      const cacheKey = buildHolisticTeamListCacheKey(requestInput);
      const cachedItems = readHolisticTeamListCache(cacheKey);

      setIsLoading(!cachedItems);
      setError(null);
      setHasRelaxedFilters(false);
      if (cachedItems && !cancelled) {
        setTeams(cachedItems);
      }

      try {
        const usedStrictAnswerFilters = Boolean(modeFilter || minPriceFilter !== undefined || maxPriceFilter !== undefined);
        const primaryResponse = await listHolisticTeams(requestInput);
        const nextItems = primaryResponse.items;

        if (!cancelled) {
          setTeams(nextItems);
          if (usedStrictAnswerFilters && nextItems.length > 0 && !nextItems.some(matchesPreferences)) {
            setHasRelaxedFilters(true);
          }
          writeHolisticTeamListCache(cacheKey, nextItems);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to load teams right now.");
          if (!cachedItems) {
            setTeams([]);
          }
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
  }, [query, scope, sort, modeFilter, packageTypeFilter, minPriceFilter, maxPriceFilter, matchesPreferences]);

  const contextSearch = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (scope) params.set("scope", scope);
    if (modeFilter) params.set("mode", modeFilter);
    if (typeof minPriceFilter === "number") params.set("minPrice", String(minPriceFilter));
    if (typeof maxPriceFilter === "number") params.set("maxPrice", String(maxPriceFilter));
    const str = params.toString();
    return str ? `?${str}` : "";
  }, [query, scope, modeFilter, minPriceFilter, maxPriceFilter]);

  const buildTeamHref = (teamId: string) => {
    return `/holistic-team/${teamId}${contextSearch}`;
  };

  const normalizedQuery = query.trim().toLowerCase();
  const isExactMatch = useCallback((team: HolisticTeam) => {
    const queryMatches =
      !normalizedQuery
      || team.queryTag?.toLowerCase() === normalizedQuery
      || team.keywords.some((keyword) => keyword.toLowerCase() === normalizedQuery);
    return queryMatches && matchesPreferences(team);
  }, [matchesPreferences, normalizedQuery]);

  const exactTeams = useMemo(
    () => teams.filter(isExactMatch),
    [isExactMatch, teams],
  );

  const closestTeams = useMemo(
    () => teams.filter((team) => !isExactMatch(team)),
    [isExactMatch, teams],
  );

  const requireLogin = (nextHref: string) => {
    if (isAuthenticated) {
      router.push(nextHref);
      return;
    }
    router.push(`/authorized?next=${encodeURIComponent(nextHref)}`);
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
    <div className="w-full py-10 lg:py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Teams ready to work on your query</p>
            <p className="text-sm text-muted-foreground">Browse team listings and select what fits your requirement.</p>
            {query.trim() && <Badge variant="secondary">Query: {query.trim()}</Badge>}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => requireLogin(`/holistic-team/create${contextSearch}`)}>
              I want to create my own team
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 bg-white dark:bg-slate-950/60 flex flex-wrap gap-3 items-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal size={16} />
            Sort & filter
          </div>
          <select className="h-9 rounded-md border px-3 text-sm bg-background" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <select className="h-9 rounded-md border px-3 text-sm bg-background" value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            <option value="">All modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select className="h-9 rounded-md border px-3 text-sm bg-background" value={packageTypeFilter} onChange={(e) => setPackageTypeFilter(e.target.value)}>
            <option value="">All packages</option>
            <option value="consultation_only">Consultation only</option>
            <option value="multi_session">Multiple sessions</option>
          </select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading teams...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hasRelaxedFilters && !error && (
          <p className="text-sm text-amber-700">
            Showing closest available teams based on your goals. You can refine filters to narrow the list.
          </p>
        )}

        {!isLoading && !error && teams.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            We could not find a ready team for this combination yet. Try adjusting mode/budget, or create your own team.
          </div>
        )}

        <div className="space-y-8">
          {exactTeams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">Exact matches</Badge>
                <p className="text-xs text-muted-foreground">Best fits for your selected query and filters.</p>
              </div>
              <div className="space-y-5">
                {exactTeams.map((team, index) => (
                  <Link key={team.id} href={buildTeamHref(team.id)} className="block rounded-xl border border-border p-4 sm:p-5 lg:p-6 bg-background hover:border-emerald-200 transition-colors">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg lg:text-xl text-foreground mb-1">{team.name || `Team ${index + 1}`}</h3>
                      <p className="text-xs text-muted-foreground">{team.members.length} members · {team.sourceType === "member_collab" ? "Member collaboration" : "Engine generated"}</p>
                    </div>

                    <div className="lg:grid lg:grid-cols-[1.5fr,1fr] lg:gap-6 space-y-5 lg:space-y-0">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team members</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {team.members.map((member) => (
                            <div key={`${team.id}-${member.professional.id}`}>
                              <ProfessionalFeatureCard
                                professional={toCardProfile(member)}
                                roleOverride={member.role}
                                ctaLabel="Book Individual expert"
                                onCtaClick={() => {
                                  goToMemberServices(member);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-slate-50/50 dark:bg-slate-950/30 p-4 space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Package size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Team price</p>
                              <p className="text-sm font-semibold text-foreground">{team.pricingCurrency} {team.pricingAmount.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <CalendarClock size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Mode / Package</p>
                              <p className="text-xs text-foreground leading-relaxed capitalize">{team.mode} · {team.packageType.replaceAll("_", " ")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row gap-2.5">
                      <Button
                        size="default"
                        className="w-full sm:w-auto bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requireLogin(buildTeamHref(team.id));
                        }}
                      >
                        {isAuthenticated ? "Select team" : "Login to select team"}
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {closestTeams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Closest available</Badge>
                <p className="text-xs text-muted-foreground">Strong alternatives based on your goals and nearby relevance.</p>
              </div>
              <div className="space-y-5">
                {closestTeams.map((team, index) => (
                  <Link key={team.id} href={buildTeamHref(team.id)} className="block rounded-xl border border-border p-4 sm:p-5 lg:p-6 bg-background hover:border-emerald-200 transition-colors">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg lg:text-xl text-foreground mb-1">{team.name || `Team ${index + 1}`}</h3>
                      <p className="text-xs text-muted-foreground">{team.members.length} members · {team.sourceType === "member_collab" ? "Member collaboration" : "Engine generated"}</p>
                    </div>

                    <div className="lg:grid lg:grid-cols-[1.5fr,1fr] lg:gap-6 space-y-5 lg:space-y-0">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team members</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {team.members.map((member) => (
                            <div key={`${team.id}-${member.professional.id}`}>
                              <ProfessionalFeatureCard
                                professional={toCardProfile(member)}
                                roleOverride={member.role}
                                ctaLabel="Book Individual expert"
                                onCtaClick={() => {
                                  goToMemberServices(member);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-slate-50/50 dark:bg-slate-950/30 p-4 space-y-3">
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Package size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Team price</p>
                              <p className="text-sm font-semibold text-foreground">{team.pricingCurrency} {team.pricingAmount.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <CalendarClock size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Mode / Package</p>
                              <p className="text-xs text-foreground leading-relaxed capitalize">{team.mode} · {team.packageType.replaceAll("_", " ")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row gap-2.5">
                      <Button
                        size="default"
                        className="w-full sm:w-auto bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          requireLogin(buildTeamHref(team.id));
                        }}
                      >
                        {isAuthenticated ? "Select team" : "Login to select team"}
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
