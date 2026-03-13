"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticArticle, WolisticSearchResult, WolisticService } from "@/types/wolistic";

import { ArticlesSection } from "./ArticlesSection";
import { FloatingSuggestion } from "./FloatingSuggestion";
import { HeroCtaBanner } from "./HeroCtaBanner";
import { ProfessionalsSection } from "./ProfessionalsSection";
import { ProductsSection } from "./ProductsSection";
import { ServicesSection } from "./ServicesSection";

type WolisticResultsPageProps = {
  query: string;
  initialData?: WolisticSearchResult;
};

export function WolisticResultsPage({ query, initialData }: WolisticResultsPageProps) {
  const router = useRouter();
  const browseSectionRef = useRef<HTMLElement>(null);

  const professionals = initialData?.professionals ?? [];
  const products = initialData?.products ?? [];
  const services = initialData?.services ?? [];
  const articles = initialData?.articles ?? [];

  const handleExpertReview = () => {
    const destination = query
      ? `/results?scope=professionals&q=${encodeURIComponent(query)}`
      : "/results?scope=professionals";
    router.push(destination);
  };

  const handleBrowse = () => {
    browseSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const expertsResultsHref = query
    ? `/results?scope=professionals&q=${encodeURIComponent(query)}`
    : "/results?scope=professionals";
  const productsResultsHref = query
    ? `/results?scope=products&q=${encodeURIComponent(query)}`
    : "/results?scope=products";

  return (
    <div className="w-full">
      <HeroCtaBanner query={query} onYes={handleExpertReview} onNo={handleBrowse} />
      <FloatingSuggestion onAccept={handleExpertReview} />

      <section
        id="browse-section"
        ref={browseSectionRef}
        className="py-10 lg:py-12 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ProfessionalsSection
            professionals={professionals}
            isLoading={false}
            resultsHref={expertsResultsHref}
          />

          <ProductsSection
            products={products}
            isLoading={false}
            resultsHref={productsResultsHref}
          />

          <ServicesSection suggestions={services} />

          <ArticlesSection suggestions={articles} />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
