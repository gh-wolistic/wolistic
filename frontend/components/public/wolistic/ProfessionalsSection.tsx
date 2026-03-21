import React from "react";
import Link from "next/link";
import { Award, Globe, MapPin, MessageCircle, Phone, Stethoscope, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { getRoleAccentFromProfessional } from "@/lib/professionalRoleAccent";
import type { ProfessionalProfile } from "@/types/professional";

type ProfessionalsSectionProps = {
  professionals: ProfessionalProfile[];
  isLoading: boolean;
  resultsHref: string;
};

function getSessionTypeVisual(sessionType: string) {
  const normalized = sessionType.trim().toLowerCase();
  const normalizedWords = normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (
    normalizedWords.includes("in person")
    || normalizedWords.includes("inperson")
    || normalizedWords.includes("offline")
    || normalizedWords.includes("onsite")
  ) {
    return { label: "In-person", icon: MapPin };
  }

  if (normalizedWords.includes("video") || normalizedWords.includes("online") || normalizedWords.includes("virtual")) {
    return { label: "Video call", icon: Video };
  }

  if (normalizedWords.includes("phone") || normalizedWords.includes("audio") || normalizedWords.includes("voice")) {
    return { label: "Phone", icon: Phone };
  }

  if (normalizedWords.includes("chat") || normalizedWords.includes("message") || normalizedWords.includes("text")) {
    return { label: "Chat", icon: MessageCircle };
  }

  if (normalizedWords.includes("group")) {
    return { label: "Group", icon: Users };
  }

  return { label: sessionType, icon: Video };
}

export function ProfessionalsSection({ professionals, isLoading, resultsHref }: ProfessionalsSectionProps) {
  if (!isLoading && professionals.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <Stethoscope size={20} />
        <h2 className="text-xl lg:text-2xl">Matching professionals</h2>
      </div>
      <p className="text-muted-foreground mb-4 dark:text-slate-200/70">
        Browse matching professionals and compare approaches, ratings, and availability.
      </p>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching professionals...</p>
      ) : (
        <div className="mb-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => {
            const roleAccent = getRoleAccentFromProfessional(professional);
            const membershipTier = String(professional.membershipTier || "").trim().toLowerCase();
            const isElite = membershipTier === "elite";

            return (
              <Link
                key={professional.id}
                href={`/${professional.username}`}
                className={`group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 ${roleAccent.cardClass} ${isElite ? "shadow-[0_0_0_1px_rgba(217,119,6,0.25)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2)]" : ""}`}
              >
              {isElite ? (
                <span className="pointer-events-none absolute -right-12 top-4 z-30 rotate-45 rounded-sm border border-amber-200/40 bg-amber-100/85 px-12 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900 dark:border-amber-300/35 dark:bg-amber-300/20 dark:text-amber-100">
                  Elite
                </span>
              ) : null}
              <div className="relative aspect-4/3 overflow-hidden">
                <ImageWithFallback
                  src={professional.image}
                  alt={professional.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <PresenceChip isOnline={professional.isOnline} className="absolute left-3 top-3" />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground">{professional.specialization}</p>
                  </div>
                  <RatingChip value={professional.rating} textClassName="text-sm" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`${roleAccent.badgeClass}`}>
                    {roleAccent.label}
                  </Badge>
                  {professional.category ? <Badge variant="secondary">{professional.category}</Badge> : null}
                  {professional.membershipTier ? <StatusChip label={professional.membershipTier} tone={isElite ? "elite" : "featured"} /> : null}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {professional.certifications.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Award size={16} />
                      <span>
                        {professional.certifications
                          .map((certification) =>
                            typeof certification === "string" ? certification : certification.name,
                          )
                          .join(", ")}
                      </span>
                    </div>
                  ) : null}
                  {professional.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{professional.location}</span>
                    </div>
                  ) : null}
                </div>

                {professional.languages.length > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe size={14} />
                    <span>Languages: {professional.languages.join(", ")}</span>
                  </div>
                ) : null}

                {professional.sessionTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {professional.sessionTypes.map((sessionType) => {
                      const visual = getSessionTypeVisual(sessionType);
                      const Icon = visual.icon;

                      return (
                        <Badge key={sessionType} variant="outline" className="gap-1.5 text-[11px]">
                          <Icon size={12} />
                          {visual.label}
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}

                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link href={resultsHref}>
        <Button variant="outline">View matching professionals</Button>
      </Link>
    </div>
  );
}
