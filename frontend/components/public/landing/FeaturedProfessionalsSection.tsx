"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { getFeaturedProfessionals } from "@/components/public/data/professionalsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import type { ProfessionalProfile } from "@/types/professional";
import { FeaturedExpertModal } from "./FeaturedExpertModal";

type PublicDestination = "professionals" | "partners";

type FeaturedProfessionalsSectionProps = {
  onNavigate?: (destination: PublicDestination) => void;
};

export function FeaturedProfessionalsSection({ onNavigate }: FeaturedProfessionalsSectionProps) {
  const router = useRouter();
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getFeaturedProfessionals(8)
      .then((items) => {
        if (!isMounted) {
          return;
        }
        setProfessionals(items);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setProfessionals([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProfessional = useMemo(
    () => professionals.find((prof) => prof.id === selectedProfessionalId) ?? null,
    [professionals, selectedProfessionalId],
  );

  const onOpenProfessionalModal = (professionalId: string) => {
    setSelectedProfessionalId(professionalId);
  };

  const onCloseProfessionalModal = () => {
    setSelectedProfessionalId(null);
  };

  const onViewFullProfile = (username: string) => {
    router.push(`/${username}`);
  };

  const onBookConsultation = (username: string) => {
    router.push(`/${username}?startBooking=1#services`);
  };

  if (professionals.length < 1) {
    return null;
  }

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2 text-3xl lg:text-4xl">Featured Experts</h2>
            <p className="text-lg text-muted-foreground">
              Connect with our top-rated certified professionals
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("professionals")}
            className="hidden md:flex"
          >
            View All
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg dark:hover:shadow-black/30 transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              role="button"
              tabIndex={0}
              aria-label={`Open profile preview for ${prof.name}`}
              onClick={() => onOpenProfessionalModal(prof.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenProfessionalModal(prof.id);
                }
              }}
            >
              <div className="aspect-4/3 relative">
                <ImageWithFallback
                  src={prof.image}
                  alt={prof.name}
                  className="w-full h-full object-cover"
                />
                {(() => {
                  const isOnline = isProfessionalOnline(prof);

                  return (
                    <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
                  );
                })()}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="mb-1 text-base">{prof.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {prof.specialization}
                    </p>
                  </div>
                  <RatingChip value={prof.rating} />
                </div>

                <Badge variant="secondary" className="mb-3 text-xs">
                  {prof.category}
                </Badge>

                <div className="mb-3 flex flex-wrap gap-2">
                  {(() => {
                    const membershipLabel = inferMembershipLabel(prof);

                    return (
                      <>
                        <StatusChip label="Certified" tone="certified" className="text-[11px]" />
                        {membershipLabel && (
                          <Badge variant="outline" className="text-[11px]">
                            {membershipLabel}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <MapPin size={12} />
                  <span className="line-clamp-1">{prof.location}</span>
                </div>

                {typeof prof.experienceYears === "number" && prof.experienceYears > 0 && (
                  <p className="mb-3 text-xs text-muted-foreground">{prof.experienceYears}+ years experience</p>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenProfessionalModal(prof.id);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button variant="outline" onClick={() => onNavigate?.("professionals")}>
            View All Professionals
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      <FeaturedExpertModal
        professional={selectedProfessional}
        isOpen={selectedProfessional !== null}
        onClose={onCloseProfessionalModal}
        onViewFullProfile={onViewFullProfile}
        onBookConsultation={onBookConsultation}
      />
    </section>
  );
}
