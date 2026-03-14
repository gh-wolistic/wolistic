"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Stethoscope } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WolisticService } from "@/types/wolistic";

const MAX_FEATURED = 8;
const DESKTOP_VISIBLE = 4;

type FeaturedWellnessCentersSectionProps = {
  initialCenters?: WolisticService[];
  onNavigate?: (destination: "wellness-centers") => void;
};

function WellnessCenterCard({ center }: { center: WolisticService }) {
  const websiteLabel = center.websiteName?.trim() || center.title;
  const detailsHref = `/wellness-center/${center.id}?returnTo=${encodeURIComponent("/results?scope=wellness-centers")}`;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
      <Link
        href={detailsHref}
        aria-label={`Open details for ${center.title}`}
        className="absolute inset-0 z-10"
      />
      {/* Image header */}
      <div className="relative h-56 w-full shrink-0 bg-linear-to-br from-slate-800/60 to-slate-900/40">
        {center.imageUrl ? (
          <ImageWithFallback
            src={center.imageUrl}
            alt={center.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Stethoscope size={32} className="text-emerald-500/30" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative z-20 flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{center.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{center.type}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{center.location}</span>
        </div>
        {center.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {center.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="px-2 py-0 text-[10px] capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {center.websiteUrl && (
          <div className="mt-auto pt-3">
            <a
              href={center.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="relative z-30 flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <ExternalLink size={12} />
              Visit {websiteLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export function FeaturedWellnessCentersSection({
  initialCenters = [],
  onNavigate,
}: FeaturedWellnessCentersSectionProps) {
  const centers = initialCenters.slice(0, MAX_FEATURED);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const n = centers.length;
  const desktopMaxIndex = Math.max(0, n - DESKTOP_VISIBLE);
  const mobileMaxIndex = Math.max(0, n - 1);
  const desktopIndex = Math.min(currentIndex, desktopMaxIndex);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNextDesktop = () => setCurrentIndex((i) => Math.min(desktopMaxIndex, i + 1));
  const goNextMobile = () => setCurrentIndex((i) => Math.min(mobileMaxIndex, i + 1));

  if (n < 1) return null;

  const desktopTrackWidth = (n / DESKTOP_VISIBLE) * 100;
  const desktopTranslate = desktopIndex * (100 / n);
  const mobileTrackWidth = n * 100;
  const mobileTranslate = currentIndex * (100 / n);

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Stethoscope size={20} />
              <h2 className="text-xl lg:text-2xl">Featured wellness centers</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.("wellness-centers")}
              className="hidden md:flex"
            >
              View All
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>

          <div className="hidden md:block relative">
            {desktopIndex > 0 && (
              <button
                aria-label="Previous wellness centers"
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
                aria-label="Next wellness centers"
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
                {centers.map((center) => (
                  <div key={center.id} className="shrink-0 px-3" style={{ width: `${100 / n}%` }}>
                    <WellnessCenterCard center={center} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <div className="overflow-hidden">
              <div
                className="flex"
                style={{
                  width: `${mobileTrackWidth}%`,
                  transform: `translateX(-${mobileTranslate}%)`,
                  transition: "transform 0.3s ease-in-out",
                }}
                onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
                onTouchEnd={(event) => {
                  if (touchStartX === null) return;
                  const delta = touchStartX - event.changedTouches[0].clientX;
                  if (delta > 50) goNextMobile();
                  else if (delta < -50) goPrev();
                  setTouchStartX(null);
                }}
              >
                {centers.map((center) => (
                  <div key={center.id} className="shrink-0" style={{ width: `${100 / n}%` }}>
                    <WellnessCenterCard center={center} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Wellness centers carousel">
              {centers.map((center, index) => (
                <button
                  key={center.id}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Go to ${center.title}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex ? "w-4 bg-foreground" : "w-2 bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => onNavigate?.("wellness-centers")}>
              View wellness centers
            </Button>
            <span className="text-xs text-muted-foreground md:hidden">Swipe to browse</span>
          </div>
        </div>
      </div>
    </section>
  );
}