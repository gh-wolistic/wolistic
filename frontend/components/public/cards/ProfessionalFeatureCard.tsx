"use client";

import { MapPin } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import { getRoleAccentByRole, getRoleAccentFromProfessional } from "@/lib/professionalRoleAccent";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import type { ProfessionalProfile } from "@/types/professional";

export type ProfessionalFeatureCardProps = {
  professional: ProfessionalProfile;
  onCardClick?: (id: string) => void;
  onCtaClick?: (id: string) => void;
  ctaLabel?: string;
  roleOverride?: string;
};

export function ProfessionalFeatureCard({
  professional,
  onCardClick,
  onCtaClick,
  ctaLabel = "View Profile",
  roleOverride,
}: ProfessionalFeatureCardProps) {
  const isOnline = isProfessionalOnline(professional);
  const membershipLabel = inferMembershipLabel(professional);
  const roleAccent = roleOverride
    ? getRoleAccentByRole(roleOverride)
    : getRoleAccentFromProfessional(professional);

  const isClickable = typeof onCardClick === "function";

  return (
    <div
      className={`bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg dark:hover:shadow-black/30 transition-shadow h-full ${roleAccent.cardClass} ${isClickable ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40" : ""}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `Open profile preview for ${professional.name}` : undefined}
      onClick={() => onCardClick?.(professional.id)}
      onKeyDown={(e) => {
        if (!isClickable) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick?.(professional.id);
        }
      }}
    >
      <div className="aspect-4/3 relative">
        <ImageWithFallback
          src={professional.image}
          alt={professional.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="w-full h-full object-cover"
        />
        <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="mb-1 text-base">{professional.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{professional.specialization}</p>
          </div>
          <RatingChip value={professional.rating} />
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-[11px] ${roleAccent.badgeClass}`}>
            {roleAccent.label}
          </Badge>
          {professional.category ? <Badge variant="secondary" className="text-xs">{professional.category}</Badge> : null}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <StatusChip label="Certified" tone="certified" className="text-[11px]" />
          {professional.placementLabel === "Boosted" && (
            <Badge variant="outline" className="text-[11px] border-amber-400/60 text-amber-200">
              Boosted
            </Badge>
          )}
          {membershipLabel && (
            <Badge variant="outline" className="text-[11px]">{membershipLabel}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin size={12} />
          <span className="line-clamp-1">{professional.location || "India"}</span>
        </div>
        {typeof professional.experienceYears === "number" && professional.experienceYears > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">{professional.experienceYears}+ years experience</p>
        )}
        <Button
          type="button"
          size="sm"
          variant={ctaLabel.toLowerCase().includes("book") ? "default" : "outline"}
          className={`w-full ${ctaLabel.toLowerCase().includes("book") ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onCtaClick?.(professional.id);
          }}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
