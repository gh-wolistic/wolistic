"use client";
import { MapPin, Clock, Globe } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import type { ProfessionalProfile } from "@/types/professional";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import { BookingPanel } from "./BookingPanel";
import { FavouriteButton } from "./FavouriteButton";
import { ShareButton } from "./ShareButton";

type ExpertHeroSectionProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
};

export function ExpertHeroSection({ professional, onBookConsultation }: ExpertHeroSectionProps) {
  const membershipLabel = inferMembershipLabel(professional);
  const isOnline = isProfessionalOnline(professional);
  const certificationLabels = professional.certifications
    .map((certification) =>
      typeof certification === "string" ? certification : certification.name,
    )
    .filter((label) => label.trim().length > 0);

  return (
      <section className="relative">
        {/* Cover Image */}
        <div className="h-52 w-full overflow-hidden bg-linear-to-br from-emerald-100 to-teal-100 dark:from-slate-900 dark:to-emerald-950/60 sm:h-64 lg:h-96">
          <ImageWithFallback
            src={professional.coverImage}
            alt={`${professional.name} cover`}
            sizes="100vw"
            loading="eager"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 lg:-mt-32">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-6 lg:p-8 dark:shadow-black/35">
              <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
                {/* Left Column - Profile */}
                <div className="space-y-5 lg:col-span-2 lg:space-y-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                    <div className="relative h-44 w-44 overflow-hidden rounded-2xl border-4 border-background shadow-lg sm:h-48 sm:w-48 sm:shrink-0">
                      <ImageWithFallback
                        src={professional.image}
                        alt={professional.name}
                        sizes="100vw"
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                      <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h1 className="text-2xl leading-tight sm:text-3xl lg:text-4xl">{professional.name}</h1>
                            <p className="mt-2 text-base text-muted-foreground sm:text-xl">{professional.specialization}</p>
                          </div>

                          <div className="flex items-center gap-2 self-start">
                            <FavouriteButton professionalId={professional.id} />
                            <ShareButton
                              username={professional.username}
                              professionalName={professional.name}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusChip label="Certified" tone="certified" />
                          {membershipLabel && (
                            <Badge variant="outline">{membershipLabel}</Badge>
                          )}
                          {typeof professional.experienceYears === "number" && professional.experienceYears > 0 && (
                            <Badge variant="secondary">{professional.experienceYears}+ years</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {professional.category && <StatusChip label={professional.category} tone="featured" />}
                        {certificationLabels.map((certificationLabel, index) => (
                          <Badge key={`${certificationLabel}-${index}`} variant="outline">
                            {certificationLabel}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex w-fit flex-wrap items-center gap-2 rounded-lg px-2 py-1.5">
                        <RatingChip value={professional.rating} textClassName="text-lg" className="px-3 py-1.5" />
                        <span className="rounded-full bg-background/70 px-2.5 py-0.5 text-xs font-medium tracking-wide text-muted-foreground dark:bg-background/40">
                          {professional.reviewCount.toLocaleString()} reviews
                        </span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base">
                          <MapPin size={18} />
                          <span>{professional.location}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base">
                          <Clock size={18} />
                          <span>{professional.availability}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground sm:text-base">
                          <Globe size={18} />
                          <span>{professional.languages.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <BookingPanel professional={professional} onBookConsultation={onBookConsultation} />
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}