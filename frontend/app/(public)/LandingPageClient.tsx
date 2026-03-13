"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LandingHeroSection } from "@/components/public/landing/HeroSection";
import { parseSearchQuery } from "@/components/public/data/searchApi";
import { HowItWorks } from "@/components/public/landing/HowItWorks";
import { FeaturedProfessionalsSection } from "@/components/public/landing/FeaturedProfessionalsSection";
import { FeaturedProductsSection } from "@/components/public/landing/FeaturedProductsSection";
import { FeaturedWellnessCentersSection } from "@/components/public/landing/FeaturedWellnessCentersSection";
import { Benefits } from "@/components/public/landing/Benefits";
import { FinalCTA } from "@/components/public/landing/FinalCTA";
import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticService } from "@/types/wolistic";

type LandingPageClientProps = {
  featuredProfessionals: ProfessionalProfile[];
  featuredProducts: Product[];
  featuredWellnessCenters: WolisticService[];
};

export function LandingPageClient({
  featuredProfessionals,
  featuredProducts,
  featuredWellnessCenters,
}: LandingPageClientProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const parsed = await parseSearchQuery(query);
      const effectiveQuery = parsed.normalized_query || query;
      router.push(`/results?scope=wolistic&q=${encodeURIComponent(effectiveQuery)}`);
    } catch {
      router.push(`/results?scope=wolistic&q=${encodeURIComponent(query)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigate = (destination: "professionals" | "partners" | "products" | "wellness-centers") => {
    if (destination === "professionals") {
      router.push("/results?scope=professionals");
      return;
    }

    if (destination === "products") {
      router.push("/results?scope=products");
      return;
    }

    if (destination === "wellness-centers") {
      router.push("/results?scope=wellness-centers");
      return;
    }

    router.push("/partners");
  };

  return (
    <div className="w-full">
      <LandingHeroSection
        onSearch={handleSearch}
        isSearching={isSearching}
        onNavigate={handleNavigate}
      />
      <FeaturedProfessionalsSection
        onNavigate={handleNavigate}
        initialProfessionals={featuredProfessionals}
      />
      <FeaturedProductsSection
        initialProducts={featuredProducts}
        onNavigate={handleNavigate}
      />
      <FeaturedWellnessCentersSection
        initialCenters={featuredWellnessCenters}
        onNavigate={handleNavigate}
      />
      <HowItWorks />
      <Benefits onNavigate={handleNavigate} />
      <FinalCTA onNavigate={handleNavigate} />
    </div>
  );
}
