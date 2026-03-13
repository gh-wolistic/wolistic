import React from "react";
import { Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="grid gap-3 md:grid-cols-2">
        {suggestions.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-4 bg-background">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.type}</p>
            <p className="text-sm text-muted-foreground">{item.location}</p>
            {item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[11px] capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {item.websiteUrl && (
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <a href={item.websiteUrl} target="_blank" rel="noreferrer">
                  Visit {item.websiteName?.trim() || item.title}
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
