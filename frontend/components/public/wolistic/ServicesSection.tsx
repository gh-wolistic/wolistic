import React from "react";
import { Stethoscope } from "lucide-react";
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
          </div>
        ))}
      </div>
    </div>
  );
}
