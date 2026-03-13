"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LandingHeroSection } from "@/components/public/landing/HeroSection";
import { parseSearchQuery } from "@/components/public/data/searchApi";
import { HowItWorks } from "@/components/public/landing/HowItWorks";
import { FeaturedProfessionalsSection } from "@/components/public/landing/FeaturedProfessionalsSection";
import { Benefits } from "@/components/public/landing/Benefits";
import { FinalCTA } from "@/components/public/landing/FinalCTA";

export default function Home() {
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

  const handleNavigate = (destination: "professionals" | "partners" | "products") => {
    if (destination === "professionals") {
      router.push("/results?scope=professionals");
      return;
    }

    if (destination === "products") {
      router.push("/results?scope=products");
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
      <FeaturedProfessionalsSection onNavigate={handleNavigate} />
      <HowItWorks />
      <Benefits onNavigate={handleNavigate} />
      <FinalCTA onNavigate={handleNavigate} />
    </div>
  );
}
