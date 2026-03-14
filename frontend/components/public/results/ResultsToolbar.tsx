"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";

import type { ResultsScope } from "./results-types";

const categoryLabels: Record<ResultsScope, string[]> = {
  professionals: ["All", "Fitness & Training", "Yoga & Mobility", "Diet & Nutrition", "Mental Wellness"],
  products: ["All", "Supplements", "Fitness Equipment", "Accessories & Lifestyle", "Recovery Equipment"],
  influencers: ["All", "Education-First", "Nutrition", "Recovery", "Mental Wellness"],
  brands: ["All", "Verified", "Emerging", "Clinical", "Lifestyle"],
  services: ["All", "Consultations", "Programs", "Workshops", "Assessments"],
  "wellness-centers": ["All", "Studios", "Clinics", "Retreats", "Recovery Spaces"],
};

type ResultsToolbarProps = {
  scope: ResultsScope;
  query: string;
  category: string;
};

export function ResultsToolbar({ scope, query, category }: ResultsToolbarProps) {
  const router = useRouter();
  const categories = categoryLabels[scope];
  const [searchText, setSearchText] = useState(query);
  const normalizedCategory = category.trim();
  const activeCategory = normalizedCategory ? normalizedCategory : "All";
  const hasActiveFilters = Boolean(query.trim() || (normalizedCategory && normalizedCategory.toLowerCase() !== "all"));

  useEffect(() => {
    setSearchText(query);
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams({ scope });
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (activeCategory.toLowerCase() !== "all") {
      params.set("category", activeCategory);
    }
    router.push(`/results?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchText("");
    router.push(`/results?scope=${scope}`);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    const params = new URLSearchParams({ scope });
    const trimmed = searchText.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (selectedCategory.toLowerCase() !== "all") {
      params.set("category", selectedCategory);
    }
    router.push(`/results?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.75rem] border border-border bg-card/70 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search anything wellness-related..."
            className="h-10 rounded-2xl border-border pl-10"
            aria-label="Search results"
          />
        </div>
        <div className="flex w-full gap-2 lg:w-auto">
          <Button
            type={hasActiveFilters ? "button" : "submit"}
            onClick={hasActiveFilters ? handleClear : undefined}
            className="h-10 w-full rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white lg:w-auto"
          >
            {hasActiveFilters ? "Clear" : "Search"}
          </Button>

        </div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 whitespace-nowrap md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:whitespace-normal">
        {categories.map((categoryOption) => (
          <button
            key={categoryOption}
            type="button"
            onClick={() => handleCategorySelect(categoryOption)}
            className="shrink-0 rounded-full"
            aria-pressed={activeCategory.toLowerCase() === categoryOption.toLowerCase()}
          >
            <Badge
              variant={activeCategory.toLowerCase() === categoryOption.toLowerCase() ? "default" : "secondary"}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 transition-colors",
                activeCategory.toLowerCase() === categoryOption.toLowerCase()
                  ? "bg-foreground text-background"
                  : "hover:bg-muted",
              )}
            >
              {categoryOption}
            </Badge>
          </button>
        ))}
      </div>
    </form>
  );
}