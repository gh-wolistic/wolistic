import React from "react";
import Link from "next/link";
import { MapPin, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { WolisticService } from "@/types/wolistic";

type ServicesSectionProps = {
  suggestions: WolisticService[];
};

export function ServicesSection({ suggestions }: ServicesSectionProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <Stethoscope size={20} />
        <h2 className="text-xl lg:text-2xl">Services and wellness centers</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((item) => (
          <article
            key={item.id}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
          >
            <Link
              href={`/wellness-center/${item.id}`}
              aria-label={`Open details for ${item.title}`}
              className="absolute inset-0 z-10"
            />

            <div className="aspect-5/3 overflow-hidden bg-muted">
              {item.imageUrl ? (
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.title}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Stethoscope size={28} className="text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="relative z-20 space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.type}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>{item.location}</span>
              </div>

              {item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.tags.slice(0, 4).map((tag) => (
                    <Badge key={`${item.id}-${tag}`} variant="outline" className="text-[11px] capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Button className="w-full" variant="outline" asChild>
                <Link href={`/wellness-center/${item.id}`}>View Center</Link>
              </Button>

              {item.websiteUrl ? (
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <a href={item.websiteUrl} target="_blank" rel="noreferrer">
                    Visit {item.websiteName?.trim() || item.title}
                  </a>
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
