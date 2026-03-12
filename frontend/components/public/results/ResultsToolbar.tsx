import { Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
};

export function ResultsToolbar({ scope, query }: ResultsToolbarProps) {
  const categories = categoryLabels[scope];

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={query}
            readOnly
            placeholder="Search"
            className="h-12 rounded-2xl border-border pl-10"
            aria-label="Results search preview"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" className="h-12 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white">
            Search
          </Button>
          <Button type="button" variant="outline" className="h-12 rounded-2xl px-4">
            <SlidersHorizontal size={16} />
            Filters
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Badge
            key={category}
            variant={index === 0 ? "default" : "secondary"}
            className={index === 0 ? "rounded-full bg-foreground px-3 py-1 text-background" : "rounded-full px-3 py-1"}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  );
}