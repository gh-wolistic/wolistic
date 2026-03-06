"use client";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MapPin, Clock, Globe } from "lucide-react";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import type { ProfessionalProfile } from "@/types/professional";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import { BookingPanel } from "./BookingPanel";

type ExpertHeroSectionProps = {
  professional: ProfessionalProfile;
  onBookConsultation: () => void;
};

export function ExpertHeroSection({ professional, onBookConsultation }: ExpertHeroSectionProps) {
  const membershipLabel = inferMembershipLabel(professional);
  const isOnline = isProfessionalOnline(professional);

  return (
      <section className="relative">
        {/* Cover Image */}
        <div className="w-full h-64 lg:h-96 overflow-hidden bg-linear-to-br from-emerald-100 to-teal-100 dark:from-slate-900 dark:to-emerald-950/60">
          <ImageWithFallback
            src={professional.coverImage}
            alt={`${professional.name} cover`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 lg:-mt-32">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl lg:p-8 dark:shadow-black/35">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Profile */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0 border-4 border-background shadow-lg">
                      <ImageWithFallback
                        src={professional.image}
                        alt={professional.name}
                        className="w-full h-full object-cover"
                      />
                      <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-3xl lg:text-4xl">{professional.name}</h1>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            aria-label="Save profile"
                            title="Save profile"
                          >
                            <Heart size={20} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            aria-label="Share profile"
                            title="Share profile"
                          >
                            <Share2 size={20} />
                          </Button>
                        </div>
                        <p className="text-xl text-muted-foreground">{professional.specialization}</p>
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
                        {professional.certifications.map((cert) => (
                          <Badge key={cert} variant="outline">
                            {cert}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex w-fit items-center gap-2 rounded-lg px-2 py-1.5">
                        <RatingChip value={professional.rating} textClassName="text-lg" className="px-3 py-1.5" />
                        <span className="rounded-full bg-background/70 px-2.5 py-0.5 text-xs font-medium tracking-wide text-muted-foreground dark:bg-background/40">
                          {professional.reviewCount.toLocaleString()} reviews
                        </span>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin size={18} />
                          <span>{professional.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock size={18} />
                          <span>{professional.availability}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
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