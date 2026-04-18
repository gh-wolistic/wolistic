"use client";
import { MapPin, Clock, Globe } from "lucide-react";
import { useEffect, useState } from "react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import type { ProfessionalProfile } from "@/types/professional";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import { BookingPanel } from "./BookingPanel";
import { FavouriteButton } from "./FavouriteButton";
import { ShareButton } from "./ShareButton";
import { getVerifiedCredentials, type VerifiedCredentialsResponse } from "@/lib/public-credentials-api";

type ExpertHeroSectionProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
  onBookSession: () => void;
};

export function ExpertHeroSection({ professional, onBookConsultation, onBookSession }: ExpertHeroSectionProps) {
  const membershipLabel = inferMembershipLabel(professional);
  const isOnline = isProfessionalOnline(professional);
  const [verifiedCredentials, setVerifiedCredentials] = useState<VerifiedCredentialsResponse | null>(null);

  // Fetch verified credentials on mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const credentials = await getVerifiedCredentials(professional.username);
        console.log('[HeroSection] Fetched verified credentials:', credentials);
        setVerifiedCredentials(credentials);
      } catch (error) {
        console.error("Failed to fetch verified credentials:", error);
        // Fail silently - component will render without verified badges
      }
    };
    void fetchCredentials();
  }, [professional.username]);

  // Only show verified credentials (no legacy fallback)
  const displayCertificates = verifiedCredentials?.certificates.map(c => c.name) || [];
  const displayLicenses = verifiedCredentials?.licenses || [];

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
                    {/* Profile Image + Chips Below */}
                    <div className="flex flex-col items-center sm:items-start gap-3">
                      <div className="relative h-52 w-52 overflow-hidden rounded-2xl border-4 border-background shadow-lg sm:h-56 sm:w-56 sm:shrink-0">
                        <ImageWithFallback
                          src={professional.image}
                          alt={professional.name}
                          sizes="100vw"
                          loading="eager"
                          className="h-full w-full object-cover"
                        />
                        <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
                      </div>

                      {/* Trust Signals Container - matches profile pic width */}
                      <div className="flex flex-col items-center gap-3 w-52 sm:w-56">
                        {/* Certified + Experience Badges */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          <StatusChip label="Certified" tone="certified" />
                          {typeof professional.experienceYears === "number" && professional.experienceYears > 0 && (
                            <Badge variant="secondary">{professional.experienceYears}+ years</Badge>
                          )}
                        </div>

                        {/* Rating + Review Count */}
                        <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5">
                            <RatingChip value={professional.rating} textClassName="text-base font-semibold" className="px-0 py-0" />
                            <span className="text-xs font-medium text-muted-foreground">rating</span>
                          </div>
                          <div className="h-4 w-px bg-border/60" />
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-semibold text-foreground">{professional.reviewCount.toLocaleString()}</span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {professional.reviewCount === 1 ? 'review' : 'reviews'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-baseline gap-3 flex-wrap">
                              <h1 className="text-2xl leading-tight sm:text-3xl lg:text-4xl">{professional.name}</h1>
                              {professional.pronouns && (
                                <span className="text-sm text-muted-foreground">({professional.pronouns})</span>
                              )}
                            </div>
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

                        {membershipLabel && (
                          <div className="mt-3">
                            <Badge variant="outline">{membershipLabel}</Badge>
                          </div>
                        )}
                      </div>

                      {/* Subcategories Row */}
                      <div className="flex flex-wrap gap-2">
                        {professional.subcategories && professional.subcategories.length > 0 ? (
                          // Show subcategories if available
                          professional.subcategories.map((subcat) => (
                            <StatusChip key={subcat} label={subcat} tone="featured" />
                          ))
                        ) : (
                          // Fallback to category if no subcategories
                          professional.category && <StatusChip label={professional.category} tone="featured" />
                        )}
                      </div>

                      {/* Certifications Row */}
                      {displayCertificates.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {displayCertificates.map((certLabel, index) => (
                            <Badge key={`cert-${certLabel}-${index}`} variant="outline">
                              {certLabel}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Licenses Row */}
                      {displayLicenses.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {displayLicenses.map((license) => (
                            <Badge key={`license-${license.id}`} variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              {license.name}
                              {license.license_number && ` • ${license.license_number}`}
                            </Badge>
                          ))}
                        </div>
                      )}

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

                <BookingPanel professional={professional} onBookConsultation={onBookConsultation} onBookSession={onBookSession} />
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}