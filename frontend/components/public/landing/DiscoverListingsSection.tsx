"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, ShoppingBag, Stethoscope } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, WolisticService } from "@/types/wolistic";

const MAX_LISTINGS = 8;

type DiscoverListingsSectionProps = {
  initialProducts?: Product[];
  initialCenters?: WolisticService[];
  onNavigate?: (destination: "products" | "wellness-centers") => void;
};

function ProductCard({ product }: { product: Product }) {
  const websiteLabel = product.websiteName?.trim() || product.brand?.trim() || "brand website";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative h-44 w-full shrink-0 bg-linear-to-br from-slate-800/60 to-slate-900/40">
        {product.image ? (
          <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover"  sizes="(max-width: 768px) 82vw, 25vw"/>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag size={28} className="text-emerald-500/30" />
          </div>
        )}
        {product.category && (
          <span className="absolute bottom-2 left-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sold by {product.brand?.trim() || product.websiteName?.trim() || "Partner brand"}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {product.websiteUrl && (
          <div className="mt-auto pt-2.5">
            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <ExternalLink size={12} />
              Check on {websiteLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

function WellnessCenterCard({ center }: { center: WolisticService }) {
  const websiteLabel = center.websiteName?.trim() || center.title;
  const detailsHref = `/wellness-center/${center.id}?returnTo=${encodeURIComponent("/results?scope=wellness-centers")}`;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
      <Link href={detailsHref} aria-label={`Open details for ${center.title}`} className="absolute inset-0 z-10" />
      <div className="relative h-44 w-full shrink-0 bg-linear-to-br from-slate-800/60 to-slate-900/40">
        {center.imageUrl ? (
          <ImageWithFallback src={center.imageUrl} alt={center.title} className="h-full w-full object-cover" sizes="(max-width: 768px) 82vw, 25vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Stethoscope size={28} className="text-emerald-500/30" />
          </div>
        )}
      </div>

      <div className="relative z-20 flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{center.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{center.type}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} className="shrink-0" />
          <span className="line-clamp-1">{center.location}</span>
        </div>
        {center.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {center.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="px-2 py-0 text-[10px] capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {center.websiteUrl && (
          <div className="mt-auto pt-2.5">
            <a
              href={center.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="relative z-30 flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <ExternalLink size={12} />
              Visit {websiteLabel}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export function DiscoverListingsSection({
  initialProducts = [],
  initialCenters = [],
  onNavigate,
}: DiscoverListingsSectionProps) {
  const products = initialProducts.slice(0, MAX_LISTINGS);
  const centers = initialCenters.slice(0, MAX_LISTINGS);

  if (products.length < 1 && centers.length < 1) {
    return null;
  }

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
          <div className="mb-5 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Stethoscope size={20} />
            <h2 className="text-xl lg:text-2xl">Discover</h2>
          </div>

          <div className="space-y-6">
            {products.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Product Listings</h3>
                  <Button variant="outline" size="sm" onClick={() => onNavigate?.("products")}>
                    View all
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
                <div className="sm:hidden overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex snap-x snap-mandatory gap-3">
                    {products.map((product) => (
                      <div key={product.id} className="w-[82%] shrink-0 snap-start">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {centers.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Wellness Center Listings</h3>
                  <Button variant="outline" size="sm" onClick={() => onNavigate?.("wellness-centers")}>
                    View all
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
                <div className="sm:hidden overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex snap-x snap-mandatory gap-3">
                    {centers.map((center) => (
                      <div key={center.id} className="w-[82%] shrink-0 snap-start">
                        <WellnessCenterCard center={center} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-3 xl:grid-cols-4">
                  {centers.map((center) => (
                    <WellnessCenterCard key={center.id} center={center} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Listings are provided for discovery and transparency, and are not curated or endorsed by Wolistic.
          </p>
        </div>
      </div>
    </section>
  );
}
