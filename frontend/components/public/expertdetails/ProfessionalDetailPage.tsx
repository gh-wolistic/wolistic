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
      {/* Back Button */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button asChild variant="ghost" className="gap-2">
            <Link href={backHref}>
              <ArrowLeft size={18} />
              Back to Professionals
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <ExpertHeroSection professional={professional} onBookConsultation={handleStartBooking} />

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
            <DesktopSectionNav />

            <div className="space-y-8">
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
