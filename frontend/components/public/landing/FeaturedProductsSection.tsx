"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, ShoppingBag } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/wolistic";

const MAX_FEATURED = 8;
const DESKTOP_VISIBLE = 4;

type FeaturedProductsSectionProps = {
  initialProducts?: Product[];
  onNavigate?: (destination: "products") => void;
};

function ProductCard({ product }: { product: Product }) {
  const websiteLabel = product.websiteName?.trim() || product.brand?.trim() || "brand website";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background">
      {/* Image header */}
      <div className="relative h-56 w-full shrink-0 bg-linear-to-br from-slate-800/60 to-slate-900/40">
        {product.image ? (
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            sizes="(max-width: 768px) 82vw, 25vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag size={32} className="text-emerald-500/30" />
          </div>
        )}
        {product.category && (
          <span className="absolute bottom-2 left-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sold by {product.brand?.trim() || product.websiteName?.trim() || "Partner brand"}
        </p>
        <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {product.websiteUrl && (
          <div className="mt-auto pt-3">
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
    </div>
  );
}

export function FeaturedProductsSection({ initialProducts = [], onNavigate }: FeaturedProductsSectionProps) {
  // Hard cap at MAX_FEATURED — defence against backend sending extras
  const products = initialProducts.slice(0, MAX_FEATURED);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const n = products.length;
  const desktopMaxIndex = Math.max(0, n - DESKTOP_VISIBLE);
  const mobileMaxIndex = Math.max(0, n - 1);
  const desktopIndex = Math.min(currentIndex, desktopMaxIndex);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNextDesktop = () => setCurrentIndex((i) => Math.min(desktopMaxIndex, i + 1));
  const goNextMobile = () => setCurrentIndex((i) => Math.min(mobileMaxIndex, i + 1));

  if (n < 1) return null;

  const desktopTrackWidth = (n / DESKTOP_VISIBLE) * 100;
  const desktopTranslate = desktopIndex * (100 / n);

  const mobileTrackWidth = n * 100;
  const mobileTranslate = currentIndex * (100 / n);

  return (
    <section className="py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <ShoppingBag size={20} />
              <h2 className="text-xl lg:text-2xl">Featured products</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.("products")}
              className="hidden md:flex"
            >
              View All
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </div>

          {/* ── Desktop carousel (md+) ── */}
          <div className="hidden md:block relative">
            {desktopIndex > 0 && (
              <button
                aria-label="Previous products"
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-accent transition-colors"
              >
                <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4 text-foreground -translate-x-px">
                  <polygon points="9,0 9,16 0,8" />
                </svg>
              </button>
            )}

            {desktopIndex < desktopMaxIndex && (
              <button
                aria-label="Next products"
                onClick={goNextDesktop}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-accent transition-colors"
              >
                <svg viewBox="0 0 10 16" fill="currentColor" className="w-3 h-4 text-foreground translate-x-px">
                  <polygon points="1,0 1,16 10,8" />
                </svg>
              </button>
            )}

            <div className="overflow-hidden">
              <div
                className="flex"
                style={{
                  width: `${desktopTrackWidth}%`,
                  transform: `translateX(-${desktopTranslate}%)`,
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                {products.map((product) => (
                  <div key={product.id} className="shrink-0 px-3" style={{ width: `${100 / n}%` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Mobile carousel (below md) ── */}
          <div className="md:hidden">
            <div className="overflow-hidden">
              <div
                className="flex"
                style={{
                  width: `${mobileTrackWidth}%`,
                  transform: `translateX(-${mobileTranslate}%)`,
                  transition: "transform 0.3s ease-in-out",
                }}
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null) return;
                  const delta = touchStartX - e.changedTouches[0].clientX;
                  if (delta > 50) goNextMobile();
                  else if (delta < -50) goPrev();
                  setTouchStartX(null);
                }}
              >
                {products.map((product) => (
                  <div key={product.id} className="shrink-0" style={{ width: `${100 / n}%` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Products carousel">
              {products.map((product, i) => (
                <button
                  key={product.id}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Go to ${product.name}`}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === currentIndex ? "w-4 bg-foreground" : "w-2 bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => onNavigate?.("products")}>
              View all products
            </Button>
            <span className="text-xs text-muted-foreground md:hidden">
              Swipe to browse
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
