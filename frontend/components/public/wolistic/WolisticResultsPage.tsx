"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticArticle, WolisticService } from "@/types/wolistic";
import { wolisticSearch } from "@/components/public/data/wolisticApi";

import { ArticlesSection } from "./ArticlesSection";
import { FloatingSuggestion } from "./FloatingSuggestion";
import { HeroCtaBanner } from "./HeroCtaBanner";
import { ProfessionalsSection } from "./ProfessionalsSection";
import { ProductsSection } from "./ProductsSection";
import { ServicesSection } from "./ServicesSection";

type WolisticResultsPageProps = {
  query: string;
};

export function WolisticResultsPage({ query }: WolisticResultsPageProps) {
  const router = useRouter();
  const browseSectionRef = useRef<HTMLElement>(null);

  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<WolisticService[]>([]);
  const [articles, setArticles] = useState<WolisticArticle[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoadingProfessionals(true);
      setIsLoadingProducts(true);

      try {
        const result = await wolisticSearch(query, 6);
        if (cancelled) return;
        setProfessionals(result.professionals);
        setProducts(result.products);
        setServices(result.services);
        setArticles(result.articles);
      } catch {
        // silently show empty sections if backend is unavailable
      } finally {
        if (!cancelled) {
          setIsLoadingProfessionals(false);
          setIsLoadingProducts(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

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
            isLoading={isLoadingProfessionals}
            resultsHref={expertsResultsHref}
          />

          <ProductsSection
            products={products}
            isLoading={isLoadingProducts}
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
