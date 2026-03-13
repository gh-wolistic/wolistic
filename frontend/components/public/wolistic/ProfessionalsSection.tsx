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
  if (!isLoading && professionals.length === 0) {
    return null;
  }

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
