we will move the next important section
#IMPORTANT keep the UI as is shared below , only logic will be updated 

the search in the hero section should direct to http://localhost:3000/results?scope=wolistic
and it looks different from our regular /results page , so if scope is either professional,products,influencers and so on , show our regular existing http://localhost:3000/results?scope= page , but if scope is "wolistic" then a different results page as UI below 

if search result is less than 1 , don't show that section , all data should come from backend 

#REMEMBER use only UI, logic should be defined , create tables and seed dummy data if required , this is AI service , all AI related services should be inside one folder in backend , including the recommendation engine 

  return (
    <div className="w-full">
      <HeroCtaBanner query={query} onYes={handleExpertReview} onNo={handleBrowse} />
      <FloatingSuggestion onAccept={handleExpertReview} />

      <section id="browse-section" className="py-10 lg:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <ProfessionalsSection
            professionals={matchingProfessionals}
            isLoading={isLoadingProfessionals}
            resultsHref={expertsResultsHref}
          />

          <ProductsSection products={matchingProducts} isLoading={isLoadingProducts} resultsHref={productsResultsHref} />

          <ServicesSection suggestions={serviceSuggestions} />

          <ArticlesSection suggestions={articleSuggestions} />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </div>
  );


  "use client";

import React from "react";
import { ArrowRight, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroCtaBannerProps = {
  query: string;
  onYes: () => void;
  onNo: () => void;
};

export function HeroCtaBanner({ query, onYes, onNo }: HeroCtaBannerProps) {
  const trimmedQuery = query.trim();

  return (
    <section className="relative overflow-hidden border-b border-border bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40">
      <div className="absolute top-12 right-16 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:bg-emerald-900 dark:opacity-25" />
      <div
        className="absolute bottom-10 left-12 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:bg-teal-900 dark:opacity-25"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm border border-border text-sm text-emerald-700 dark:bg-slate-900/70 dark:text-emerald-300">
              <Sparkles size={16} />
              Your Wolistic journey starts here
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
                Need an expert to help you with your journey?
              </h1>
              {trimmedQuery ? (
                <p className="text-sm text-emerald-700 bg-white/70 inline-flex items-center gap-2 rounded-full px-4 py-2 border border-emerald-100 shadow-sm dark:bg-slate-900/70 dark:text-emerald-200">
                  <Brain size={16} /> Your focus: {trimmedQuery}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={onYes}
                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 h-12 px-7 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Yes, get an expert review
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onNo}
                className="h-12 px-7 rounded-xl border-2 border-border hover:bg-background/70"
              >
                No, I’ll browse myself
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative rounded-3xl border border-border bg-white/70 shadow-xl backdrop-blur-sm dark:bg-slate-900/80">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Focus on your goals while our certified experts design a personalized plan just for you.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="relative rounded-2xl border border-emerald-300 dark:border-emerald-500/60 p-3 bg-linear-to-br from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30 ring-1 ring-emerald-200/50 dark:ring-emerald-400/20">
                    <p className="font-medium text-emerald-900 dark:text-emerald-200">Expert Review</p>
                    <p className="text-emerald-700/90 dark:text-emerald-300/80">Share your query — experts validate, suggest, guide, and support you throughout your journey.</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 p-3 bg-white/50 dark:bg-slate-950/30 opacity-60 dark:opacity-70">
                    <p className="font-medium text-muted-foreground">Self-Browse</p>
                    <p className="text-muted-foreground/70">Time-consuming with too many options to sort through.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


"use client";

import React, { useEffect, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_IDLE_MS = 4000;

type FloatingSuggestionProps = {
  onAccept: () => void;
  idleMs?: number;
};

export function FloatingSuggestion({ onAccept, idleMs = DEFAULT_IDLE_MS }: FloatingSuggestionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const resetTimer = () => {
      setVisible(false);
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => setVisible(true), idleMs);
    };

    resetTimer();
    window.addEventListener("scroll", resetTimer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener("scroll", resetTimer);
    };
  }, [idleMs]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 max-w-sm rounded-2xl border border-border bg-background shadow-xl p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
          <MessageCircleQuestion size={18} />
        </div>
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium">Want an expert help?</p>
          <p className="text-xs text-muted-foreground">We are here to make your journey easier.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept} className="bg-linear-to-r from-emerald-500 to-teal-600 text-white">
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
              <X size={14} className="mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { ProfessionalProfile } from "@/types/professional";

type ProfessionalsSectionProps = {
  professionals: ProfessionalProfile[];
  isLoading: boolean;
  resultsHref: string;
};

export function ProfessionalsSection({ professionals, isLoading, resultsHref }: ProfessionalsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <Stethoscope size={20} />
        <h2 className="text-xl lg:text-2xl">Matching professionals</h2>
      </div>
      <p className="text-muted-foreground mb-4 dark:text-slate-200/70">
        Browse matching professionals and compare approaches, ratings, and availability.
      </p>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching professionals...</p>
      ) : professionals.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No matching professionals found yet for this query.</p>
      ) : (
        <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <Link
              key={professional.id}
              href={`/${professional.username}`}
              className="overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md"
            >
              <div className="aspect-4/3">
                <ImageWithFallback
                  src={professional.image}
                  alt={professional.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="font-medium leading-tight">{professional.name}</p>
                <p className="text-sm text-muted-foreground">{professional.specialization}</p>
                <p className="text-xs text-muted-foreground">{professional.location}</p>
                <p className="text-xs text-muted-foreground">⭐ {professional.rating}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href={resultsHref}>
        <Button variant="outline">View matching professionals</Button>
      </Link>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { Product } from "@/types/product";

type ProductsSectionProps = {
  products: Product[];
  isLoading: boolean;
  resultsHref: string;
};

export function ProductsSection({ products, isLoading, resultsHref }: ProductsSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <ShoppingBag size={20} />
        <h2 className="text-xl lg:text-2xl">Products we recommend</h2>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching products...</p>
      ) : products.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No matching products found yet for this query.</p>
      ) : (
        <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="aspect-4/3">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">₹{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href={resultsHref}>
        <Button variant="outline">View matching products</Button>
      </Link>
    </div>
  );
}


import React from "react";
import { Stethoscope } from "lucide-react";

type ServiceSuggestion = {
  id: string;
  title: string;
  type: string;
  location: string;
};

type ServicesSectionProps = {
  suggestions: ServiceSuggestion[];
};

export function ServicesSection({ suggestions }: ServicesSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <Stethoscope size={20} />
        <h2 className="text-xl lg:text-2xl">Services and wellness centers</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {suggestions.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-4 bg-background">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.type}</p>
            <p className="text-sm text-muted-foreground">{item.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


import React from "react";
import { BookOpenText } from "lucide-react";

type ArticleSuggestion = {
  id: string;
  title: string;
  readTime: string;
};

type ArticlesSectionProps = {
  suggestions: ArticleSuggestion[];
};

export function ArticlesSection({ suggestions }: ArticlesSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <BookOpenText size={20} />
        <h2 className="text-xl lg:text-2xl">Articles related to your request</h2>
      </div>
      <div className="space-y-3">
        {suggestions.map((article) => (
          <div key={article.id} className="rounded-xl border border-border p-4 bg-background">
            <p className="font-medium">{article.title}</p>
            <p className="text-sm text-muted-foreground">{article.readTime}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


##Backend
class wolisticPlan(Base):
    __tablename__ = "wolistic_plans"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    package_price: Mapped[str] = mapped_column(Text, nullable=False)
    schedule: Mapped[str] = mapped_column(Text, nullable=False)
    includes: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    experts: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    assignment_status: Mapped[str] = mapped_column(Text, nullable=False, default="recommended")
    session_breakdown: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


  from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.holistic_plan import HolisticPlan
from app.schemas.plans import RecommendedPlansResponse, HolisticPlan as HolisticPlanSchema

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/recommended", response_model=RecommendedPlansResponse)
async def get_recommended_plans(db: AsyncSession = Depends(get_db)) -> RecommendedPlansResponse:
    result = await db.execute(
        select(HolisticPlan).order_by(HolisticPlan.sort_order.asc(), HolisticPlan.created_at.desc())
    )
    plans = result.scalars().all()

    items = [
        HolisticPlanSchema(
          id=plan.id,
          title=plan.title,
          packagePrice=plan.package_price,
          schedule=plan.schedule,
          includes=plan.includes,
          experts=plan.experts,
          assignmentStatus=plan.assignment_status,
                    sessionBreakdown=plan.session_breakdown,
        )
        for plan in plans
    ]

    return RecommendedPlansResponse(items=items)