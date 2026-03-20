"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import { getFeaturedProfessionalsNearby } from "@/components/public/data/professionalsApi";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import { inferMembershipLabel, isProfessionalOnline } from "@/lib/professionalSignals";
import type { ProfessionalProfile } from "@/types/professional";
import { FeaturedExpertModal } from "./FeaturedExpertModal";

const MAX_FEATURED = 8;
const DESKTOP_VISIBLE = 4;
const GEO_RESOLUTION_TIMEOUT_MS = 2500;

type PublicDestination = "professionals" | "partners";
type FeaturedDataSource = "loading" | "nearby" | "fallback";

type FeaturedProfessionalsSectionProps = {
  onNavigate?: (destination: PublicDestination) => void;
  initialProfessionals?: ProfessionalProfile[];
};

function ProfessionalCard({
  prof,
  onOpen,
}: {
  prof: ProfessionalProfile;
  onOpen: (id: string) => void;
}) {
  const isOnline = isProfessionalOnline(prof);
  const membershipLabel = inferMembershipLabel(prof);

  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg dark:hover:shadow-black/30 transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 h-full"
      role="button"
      tabIndex={0}
      aria-label={`Open profile preview for ${prof.name}`}
      onClick={() => onOpen(prof.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(prof.id);
        }
      }}
    >
      <div className="aspect-4/3 relative">
        <ImageWithFallback src={prof.image} alt={prof.name} className="w-full h-full object-cover" />
        <PresenceChip isOnline={isOnline} className="absolute left-3 top-3" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="mb-1 text-base">{prof.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{prof.specialization}</p>
          </div>
          <RatingChip value={prof.rating} />
        </div>
        <Badge variant="secondary" className="mb-3 text-xs">{prof.category}</Badge>
        <div className="mb-3 flex flex-wrap gap-2">
          <StatusChip label="Certified" tone="certified" className="text-[11px]" />
          {prof.placementLabel === "Boosted" && (
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
          onClick={(e) => {
            e.stopPropagation();
            onOpen(prof.id);
          }}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

export function FeaturedProfessionalsSection({ onNavigate, initialProfessionals = [] }: FeaturedProfessionalsSectionProps) {
  const router = useRouter();
  const fallbackProfessionals = useMemo(
    () => initialProfessionals.slice(0, MAX_FEATURED),
    [initialProfessionals],
  );

  // Hard cap at MAX_FEATURED — defence against backend sending extras
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>(fallbackProfessionals);
  const [dataSource, setDataSource] = useState<FeaturedDataSource>(
    fallbackProfessionals.length > 0 ? "fallback" : "loading",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const applyFallback = () => {
      if (isCancelled) return;
      setProfessionals(fallbackProfessionals);
      setDataSource("fallback");
      setCurrentIndex(0);
    };

    const resolveGeolocation = async () => {
      if (fallbackProfessionals.length < 1) {
        setDataSource("loading");
      }

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        applyFallback();
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject(new Error("geolocation-resolution-timeout"));
          }, GEO_RESOLUTION_TIMEOUT_MS);

          navigator.geolocation.getCurrentPosition(
            (value) => {
              window.clearTimeout(timeoutId);
              resolve(value);
            },
            (error) => {
              window.clearTimeout(timeoutId);
              reject(error);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000,
            },
          );
        });

        const nearbyProfessionals = await getFeaturedProfessionalsNearby(
          position.coords.latitude,
          position.coords.longitude,
          { limit: MAX_FEATURED, radiusKm: 300 },
        );

        if (isCancelled) return;

        if (nearbyProfessionals.length > 0) {
          setProfessionals(nearbyProfessionals.slice(0, MAX_FEATURED));
          setDataSource("nearby");
          setCurrentIndex(0);
          return;
        }

        applyFallback();
      } catch {
        applyFallback();
      }
    };

    void resolveGeolocation();

    return () => {
      isCancelled = true;
    };
  }, [fallbackProfessionals]);

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === selectedProfessionalId) ?? null,
    [professionals, selectedProfessionalId],
  );

  const n = professionals.length;
  const desktopMaxIndex = Math.max(0, n - DESKTOP_VISIBLE);
  const mobileMaxIndex = Math.max(0, n - 1);
  const desktopIndex = Math.min(currentIndex, desktopMaxIndex);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNextDesktop = () => setCurrentIndex((i) => Math.min(desktopMaxIndex, i + 1));
  const goNextMobile = () => setCurrentIndex((i) => Math.min(mobileMaxIndex, i + 1));

  const onOpen = (id: string) => setSelectedProfessionalId(id);
  const onClose = () => setSelectedProfessionalId(null);
  const onViewFullProfile = (username: string) => router.push(`/${username}`);
  const onBookConsultation = (username: string) => router.push(`/${username}?startBooking=1#services`);

  if (dataSource !== "loading" && n < 1) return null;

  // Track width is expressed as a % of the container.
  // Desktop: n cards must fit, but only DESKTOP_VISIBLE are shown at once.
  // Mobile: n cards must fit, but only 1 is shown at once.
  // translateX moves by (100/n)% per step — exactly one card-width.
  const desktopTrackWidth = (n / DESKTOP_VISIBLE) * 100;
  const desktopTranslate = desktopIndex * (100 / n);

  const mobileTrackWidth = n * 100;
  const mobileTranslate = currentIndex * (100 / n);

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="mb-2 text-3xl lg:text-4xl">Featured Experts</h2>
            <p className="text-lg text-muted-foreground">
              {dataSource === "loading" && "Finding nearby experts for your location..."}
              {dataSource === "nearby" && "Showing top-rated certified professionals near you"}
              {dataSource === "fallback" && "Showing popular certified professionals across India"}
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

        {dataSource === "loading" ? (
          <>
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              {Array.from({ length: DESKTOP_VISIBLE }).map((_, index) => (
                <FeaturedCardSkeleton key={`featured-skeleton-desktop-${index}`} />
              ))}
            </div>
            <div className="md:hidden grid grid-cols-1 gap-4">
              <FeaturedCardSkeleton />
            </div>
          </>
        ) : (
        <>
        {/* ── Desktop carousel (md+) ── */}
        <div className="hidden md:block relative">
          {desktopIndex > 0 && (
            <button
              aria-label="Previous professionals"
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-accent transition-colors"
            >
              <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4 text-foreground -translate-x-px">
                <polygon points="9,0 9,16 0,8" />
              </svg>
            </button>
          )}

          {desktopIndex < desktopMaxIndex && (
            <button
              aria-label="Next professionals"
              onClick={goNextDesktop}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-accent transition-colors"
            >
              <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4 text-foreground translate-x-px">
                <polygon points="1,0 1,16 10,8" />
              </svg>
            </button>
          )}

          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                width: `${desktopTrackWidth}%`,
                transform: `translateX(-${desktopTranslate}%)`,
                transition: "transform 0.3s ease-in-out",
              }}
            >
              {professionals.map((prof) => (
                <div key={prof.id} className="shrink-0 px-3" style={{ width: `${100 / n}%` }}>
                  <ProfessionalCard prof={prof} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mobile carousel (below md) ── */}
        <div className="md:hidden">
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                width: `${mobileTrackWidth}%`,
                transform: `translateX(-${mobileTranslate}%)`,
                transition: "transform 0.3s ease-in-out",
              }}
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchStartX === null) return;
                const delta = touchStartX - e.changedTouches[0].clientX;
                if (delta > 50) goNextMobile();
                else if (delta < -50) goPrev();
                setTouchStartX(null);
              }}
            >
              {professionals.map((prof) => (
                <div key={prof.id} className="shrink-0" style={{ width: `${100 / n}%` }}>
                  <ProfessionalCard prof={prof} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Professionals carousel">
            {professionals.map((prof, i) => (
              <button
                key={prof.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Go to ${prof.name}`}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === currentIndex ? "w-4 bg-foreground" : "w-2 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
        </>
        )}

        {/* Mobile view-all */}
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
        onClose={onClose}
        onViewFullProfile={onViewFullProfile}
        onBookConsultation={onBookConsultation}
      />
    </section>
  );
}
