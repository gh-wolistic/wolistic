import React from "react";
import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import type { Product } from "@/types/wolistic";

type ProductsSectionProps = {
  products: Product[];
  isLoading: boolean;
  resultsHref: string;
};

export function ProductsSection({ products, isLoading, resultsHref }: ProductsSectionProps) {
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
        <ShoppingBag size={20} />
        <h2 className="text-xl lg:text-2xl">Products matching your needs</h2>
      </div>

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Loading matching products...</p>
      ) : (
        <div className="mb-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="aspect-5/5 overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="relative z-20 space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
                  <Badge variant="outline">Matched</Badge>
                </div>

                {product.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                ) : null}

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</p>
                    <p className="text-sm font-semibold tracking-tight">
                      {product.brand?.trim() || product.websiteName?.trim() || "Partner brand"}
                    </p>
                  </div>
                  <p className="text-xl font-semibold tracking-tight">₹{product.price.toLocaleString("en-IN")}</p>
                </div>

                <Button className="relative z-30 w-full" variant="outline" asChild={Boolean(product.websiteUrl)}>
                  {product.websiteUrl ? (
                    <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
                      <ExternalLink size={14} className="mr-1.5" />
                      Visit Site
                    </a>
                  ) : (
                    <span>Link unavailable</span>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  {product.websiteName?.trim() || product.brand?.trim()
                    ? `Opens ${product.websiteName?.trim() || product.brand?.trim()} website`
                    : "Static product card preview for future marketplace results."}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <Link href={resultsHref}>
        <Button variant="outline">View matching products</Button>
      </Link>
    </div>
  );
}
