"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Package, SlidersHorizontal } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listHolisticTeams } from "@/components/public/data/holisticTeamsApi";
import { getRoleAccentByRole } from "@/lib/professionalRoleAccent";
import type { HolisticTeam } from "@/types/holistic-team";

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);
      setHasRelaxedFilters(false);
      try {
        const primaryResponse = await listHolisticTeams({
          q: query,
          scope,
          sort,
          mode: modeFilter || undefined,
          packageType: packageTypeFilter || undefined,
          minPrice: minPriceFilter,
          maxPrice: maxPriceFilter,
        });
        let nextItems = primaryResponse.items;

        const usedStrictAnswerFilters = Boolean(modeFilter || minPriceFilter !== undefined || maxPriceFilter !== undefined);
        if (nextItems.length === 0 && usedStrictAnswerFilters) {
          const relaxedResponse = await listHolisticTeams({
            q: query,
            scope,
            sort,
            packageType: packageTypeFilter || undefined,
          });
          nextItems = relaxedResponse.items;
          if (!cancelled && nextItems.length > 0) {
            setHasRelaxedFilters(true);
          }
        }

        if (!cancelled) {
          setTeams(nextItems);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to load teams right now.");
          setTeams([]);
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
  }, [query, scope, sort, modeFilter, packageTypeFilter, minPriceFilter, maxPriceFilter]);

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

  const requireLogin = (nextHref: string) => {
    if (isAuthenticated) {
      router.push(nextHref);
      return;
    }
    router.push(`/authorized?next=${encodeURIComponent(nextHref)}`);
  };

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
            No exact team matched all answer filters, so we broadened results to show the closest available teams.
          </p>
        )}

        {!isLoading && !error && teams.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No teams found for this filter combination.
          </div>
        )}

        <div className="space-y-5">
          {teams.map((team, index) => (
            <Link key={team.id} href={buildTeamHref(team.id)} className="block rounded-xl border border-border p-5 lg:p-6 bg-background hover:border-emerald-200 transition-colors">
              <div className="mb-4">
                <h3 className="font-semibold text-lg lg:text-xl text-foreground mb-1">{team.name || `Team ${index + 1}`}</h3>
                <p className="text-xs text-muted-foreground">{team.members.length} members · {team.sourceType === "member_collab" ? "Member collaboration" : "Engine generated"}</p>
              </div>

              <div className="lg:grid lg:grid-cols-[1.5fr,1fr] lg:gap-6 space-y-5 lg:space-y-0">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team members</p>
                  <div className="flex gap-3 flex-wrap">
                    {team.members.map((member) => (
                      <div
                        key={`${team.id}-${member.professional.id}`}
                        className={`w-40 sm:w-44 rounded-lg border border-border overflow-hidden bg-white dark:bg-slate-950/50 dark:border-slate-800 ${getRoleAccentByRole(member.role).cardClass}`}
                      >
                        <div className="aspect-square">
                          <ImageWithFallback src={member.professional.image} alt={member.professional.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-medium leading-tight truncate text-foreground">{member.professional.name}</p>
                          <Badge variant="outline" className={`mt-1 text-[10px] ${getRoleAccentByRole(member.role).badgeClass}`}>
                            {getRoleAccentByRole(member.role).label}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">{member.sessionsIncluded} session(s)</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 px-2 text-[10px]"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              requireLogin(`/${member.professional.username}`);
                            }}
                          >
                            Book individual
                          </Button>
                        </div>
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
                  className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
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
    </div>
  );
}
