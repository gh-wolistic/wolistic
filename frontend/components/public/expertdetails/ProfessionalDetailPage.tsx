"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import type { ProfessionalProfile } from "@/types/professional";
import { toCamelProfile } from "@/components/public/data/professionalsApi";
import { ExpertHeroSection } from "./sections/HeroSection";
import { AboutServicesSection } from "./sections/AboutServicesSection";
import { GalleryProductsSection } from "./sections/GalleryProductsSection";
import { ReviewsSection } from "./sections/ReviewsSection";
import { SidebarSection } from "./sections/SidebarSection";
import { DesktopSectionNav } from "./sections/DesktopSectionNav";
import { MobileSectionNav } from "./sections/MobileSectionNav";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api/v1";

type ProfessionalDetailPageProps = {
  professional: ProfessionalProfile;
};

export function ProfessionalDetailPage({ professional: publishedProfile }: ProfessionalDetailPageProps) {
  const searchParams = useSearchParams();
  const { user, accessToken } = useAuthSession();
  const [bookingStartSignal, setBookingStartSignal] = useState(0);
  const [professional, setProfessional] = useState<ProfessionalProfile>(publishedProfile);
  const [isDraftPreview, setIsDraftPreview] = useState(false);

  const returnTo = searchParams.get("returnTo");
  const shouldStartBooking = searchParams.get("startBooking") === "1";
  const wantsDraftPreview = searchParams.get("preview") === "draft";
  const backHref =
    returnTo && returnTo.startsWith("/results")
      ? returnTo
      : "/results?scope=professionals";

  // Fetch draft profile when the owner visits with ?preview=draft
  useEffect(() => {
    if (!wantsDraftPreview || !accessToken) return;

    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/professionals/me/profile/draft`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return; // fall back to published if not authorized
        const raw = (await res.json()) as Record<string, unknown>;
        // Only swap to draft view if this is the owner's own profile
        if (String(raw.username) === publishedProfile.username) {
          const draft = toCamelProfile(raw);
          setProfessional(draft);
          setIsDraftPreview(true);
        }
      } catch {
        // silently fall back to published data
      }
    })();
  }, [wantsDraftPreview, accessToken, publishedProfile.username]);

  const handleStartBooking = useCallback(() => {
    const servicesSection = document.getElementById("services");
    servicesSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    setBookingStartSignal((prev) => prev + 1);
  }, []);

  const handleBookSession = useCallback(() => {
    const sessionsSection = document.getElementById("sessions");
    sessionsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (shouldStartBooking) {
      window.setTimeout(() => {
        handleStartBooking();
      }, 100);
    }
  }, [handleStartBooking, shouldStartBooking]);

  return (
    <div className="w-full">
      <section className="border-b border-border/60 bg-background">
        <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" className="h-auto px-0 text-muted-foreground hover:text-foreground">
            <Link href={backHref}>
              <ArrowLeft size={16} className="mr-2" />
              Back to results
            </Link>
          </Button>
        </div>
      </section>

      {isDraftPreview && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-300">
          <Eye size={14} className="mr-2 inline-block" />
          Draft preview — only you can see this. Changes are not visible to clients until you Publish.
        </div>
      )}

      {/* Hero Section */}
      <ExpertHeroSection professional={professional} onBookConsultation={handleStartBooking} onBookSession={handleBookSession} />

      <section className="bg-background py-8 sm:py-10 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <MobileSectionNav />

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:gap-8">
            <DesktopSectionNav />

            <div className="space-y-6 sm:space-y-8">
              <AboutServicesSection
                professional={professional}
                bookingStartSignal={bookingStartSignal}
              />
              <GalleryProductsSection professional={professional} />
              <ReviewsSection 
                professionalId={professional.id} 
                professionalName={professional.name}
              />
            </div>

            <div className="hidden lg:block">
              <SidebarSection professional={professional} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
