import Link from "next/link";
import { Building2, MapPin, ShoppingBag, Stethoscope, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

import { scopeOptions } from "@/components/public/results/results-data";
import type { ResultsScope } from "./results-types";

const scopeIcons = {
  professionals: Users,
  products: ShoppingBag,
  influencers: Users,
  brands: Building2,
  services: Stethoscope,
  "wellness-centers": MapPin,
} as const;

type ResultsScopeTabsProps = {
  activeScope: ResultsScope;
  query: string;
};

export function ResultsScopeTabs({ activeScope, query }: ResultsScopeTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {scopeOptions.map((scopeOption) => {
        const Icon = scopeIcons[scopeOption.key];
        const isActive = scopeOption.key === activeScope;
        const href = query
          ? `/results?scope=${scopeOption.key}&q=${encodeURIComponent(query)}`
          : `/results?scope=${scopeOption.key}`;

        return (
          <Button
            key={scopeOption.key}
            asChild
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-10 rounded-full px-4",
              isActive ? "bg-linear-to-r from-emerald-500 to-teal-600 text-white" : "",
            )}
          >
            <Link href={href} aria-current={isActive ? "page" : undefined}>
              <Icon size={14} className="mr-1.5" />
              {scopeOption.label}
              {!scopeOption.isReady ? (
                <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-80">
                  Soon
                </span>
              ) : null}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}