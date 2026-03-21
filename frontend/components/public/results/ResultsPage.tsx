import { searchProfessionals } from "@/components/public/data/professionalsApi";
import { getFeaturedWellnessCenters } from "@/components/public/data/wellnessCentersApi";
import type { ProfessionalProfile } from "@/types/professional";
import type { WolisticService } from "@/types/wolistic";

import { scopeOptions } from "./results-data";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsScopeTabs } from "./ResultsScopeTabs";
import { ResultsStickyBar } from "./ResultsStickyBar";
import { ResultsToolbar } from "./ResultsToolbar";
import type { ResultsScope } from "./results-types";

export type { ResultsScope } from "./results-types";

const supportedScopes = scopeOptions.map((scopeOption) => scopeOption.key);

export function resolveResultsScope(value?: string | null): ResultsScope {
  if (!value) {
    return "professionals";
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "professional") {
    return "professionals";
  }

  const normalized = normalizedValue as ResultsScope;

  if (supportedScopes.includes(normalized)) {
    return normalized;
  }

  return "professionals";
}

type ResultsPageProps = {
  scope: ResultsScope;
  query: string;
  category: string;
  currentPage: number;
};

const PAGE_SIZE = 8;

const PROFESSIONAL_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "fitness & training": ["fitness", "training", "strength", "conditioning", "workout", "gym"],
  "yoga & mobility": ["yoga", "mobility", "flexibility", "pilates", "posture"],
  "diet & nutrition": ["diet", "nutrition", "meal", "fat loss", "weight loss", "metabolic"],
  "mental wellness": ["mental", "mindfulness", "stress", "anxiety", "therapy", "counsel", "wellbeing", "well-being"],
};

function filterProfessionalsByCategory(items: ProfessionalProfile[], category: string): ProfessionalProfile[] {
  const normalizedCategory = category.trim().toLowerCase();
  if (!normalizedCategory || normalizedCategory === "all") {
    return items;
  }

  const categoryKeywords = PROFESSIONAL_CATEGORY_KEYWORDS[normalizedCategory] ?? [normalizedCategory];

  return items.filter((profile) => {
    const searchableText = [
      profile.category,
      profile.specialization,
      ...(profile.subcategories ?? []),
      ...(profile.specializations ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return categoryKeywords.some((keyword) => searchableText.includes(keyword));
  });
}

export async function ResultsPage({ scope, query, category, currentPage }: ResultsPageProps) {
  const selectedScope = scopeOptions.find((scopeOption) => scopeOption.key === scope) ?? scopeOptions[0];
  const params = new URLSearchParams({ scope });
  if (query) {
    params.set("q", query);
  }
  if (category && category.toLowerCase() !== "all") {
    params.set("category", category);
  }
  const baseHref = `/results?${params.toString()}`;
  const summary = query
    ? `Showing ${selectedScope.label.toLowerCase()} for “${query}”`
    : `Showing all ${selectedScope.label.toLowerCase()}`;

  let professionals: ProfessionalProfile[] = [];
  let wellnessCenters: WolisticService[] = [];
  let totalPages = 1;
  let safePage = 1;

  if (scope === "professionals") {
    const allProfessionals = await searchProfessionals(query, 60);
    const filteredProfessionals = filterProfessionalsByCategory(allProfessionals, category);
    totalPages = Math.max(1, Math.ceil(filteredProfessionals.length / PAGE_SIZE));
    safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    professionals = filteredProfessionals.slice(startIndex, startIndex + PAGE_SIZE);
  }

  if (scope === "wellness-centers") {
    const allCenters = await getFeaturedWellnessCenters(8);
    const normalizedQuery = query.trim().toLowerCase();

    wellnessCenters = normalizedQuery
      ? allCenters.filter((center) => {
        const searchable = [
          center.title,
          center.type,
          center.location,
          ...(center.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      })
      : allCenters;
  }

  const returnTo = safePage > 1 ? `${baseHref}&page=${safePage}` : baseHref;

  return (
    <div className="w-full">

      <ResultsStickyBar
        scopeTabs={<ResultsScopeTabs activeScope={scope} query={query} />}
        toolbar={<ResultsToolbar scope={scope} query={query} category={category} />}
      />

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ResultsGrid
            scope={scope}
            query={query}
            returnTo={returnTo}
            professionals={professionals}
            wellnessCenters={wellnessCenters}
            pagination={scope === "professionals" ? { currentPage: safePage, totalPages, baseHref } : undefined}
          />
        </div>
      </section>
    </div>
  );
}