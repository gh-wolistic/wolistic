"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProfessionalProfile } from "@/types/professional";
import { ExpertHeroSection } from "./sections/HeroSection";
import { AboutServicesSection } from "./sections/AboutServicesSection";
import { GalleryProductsSection } from "./sections/GalleryProductsSection";
import { ReviewsSection } from "./sections/ReviewsSection";
import { SidebarSection } from "./sections/SidebarSection";
import { DesktopSectionNav } from "./sections/DesktopSectionNav";
import { MobileSectionNav } from "./sections/MobileSectionNav";

type ProfessionalDetailPageProps = {
  professional: ProfessionalProfile;
};

export function ProfessionalDetailPage({ professional }: ProfessionalDetailPageProps) {
  const searchParams = useSearchParams();
  const [bookingStartSignal, setBookingStartSignal] = useState(0);
  const returnTo = searchParams.get("returnTo");
  const shouldStartBooking = searchParams.get("startBooking") === "1";
  const backHref =
    returnTo && returnTo.startsWith("/results")
      ? returnTo
      : "/results?scope=professionals";

  const handleStartBooking = useCallback(() => {
    const servicesSection = document.getElementById("services");
    servicesSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    setBookingStartSignal((prev) => prev + 1);
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

      {/* Hero Section */}
      <ExpertHeroSection professional={professional} onBookConsultation={handleStartBooking} />

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
              <ReviewsSection professionalId={professional.id} />
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
