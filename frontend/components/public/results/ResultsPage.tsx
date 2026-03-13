import { searchProfessionals } from "@/components/public/data/professionalsApi";
import type { ProfessionalProfile } from "@/types/professional";

import { scopeOptions } from "./results-data";
import { ResultsGrid } from "./ResultsGrid";
import { ResultsScopeTabs } from "./ResultsScopeTabs";
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
};

export async function ResultsPage({ scope, query }: ResultsPageProps) {
  const selectedScope = scopeOptions.find((scopeOption) => scopeOption.key === scope) ?? scopeOptions[0];
  const returnTo = query ? `/results?scope=${scope}&q=${encodeURIComponent(query)}` : `/results?scope=${scope}`;
  const summary = query
    ? `Showing ${selectedScope.label.toLowerCase()} for “${query}”`
    : `Showing all ${selectedScope.label.toLowerCase()}`;

  let professionals: ProfessionalProfile[] = [];
  if (scope === "professionals") {
    professionals = await searchProfessionals(query, 24);
  }

  return (
    <div className="w-full">

      <section className="sticky top-20 z-40 border-b border-border bg-background/92 backdrop-blur">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground/90">{summary}</p>
            <ResultsScopeTabs activeScope={scope} query={query} />
            <ResultsToolbar scope={scope} query={query} />
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ResultsGrid scope={scope} returnTo={returnTo} professionals={professionals} />
        </div>
      </section>
    </div>
  );
}