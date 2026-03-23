import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ExternalLink, ShieldCheck, Sparkles, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { getCatalogBrandBySlug } from "@/components/public/data/catalogApi";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type BrandDetailsPageProps = {
  params: Promise<{ brandSlug: string }>;
  searchParams?: Promise<{ returnTo?: string; category?: string; sort?: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type BrandSort = "rating-desc" | "price-asc" | "price-desc" | "name-asc";

function getBrandDescription(name: string, categories: string[]) {
  const categoriesText = categories.join(", ");
  return `${name} offers curated wellness products across ${categoriesText}. Explore products, services, and trust markers in one place.`;
}

function sortProducts<T extends { rating: number; price: number; name: string }>(items: T[], sort: BrandSort): T[] {
  const copy = [...items];

  if (sort === "rating-desc") {
    return copy.sort((a, b) => b.rating - a.rating);
  }
  if (sort === "price-asc") {
    return copy.sort((a, b) => a.price - b.price);
  }
  if (sort === "price-desc") {
    return copy.sort((a, b) => b.price - a.price);
  }
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

export async function generateMetadata({ params }: BrandDetailsPageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getCatalogBrandBySlug(brandSlug);

  if (!brand) {
    return { title: "Brand Not Found", robots: { index: false, follow: true } };
  }

  const title = `${brand.name} Brand Details`;
  const description = getBrandDescription(brand.name, brand.categories);
  const canonicalPath = `/brand/${brand.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      images: brand.heroImageUrl ? [{ url: brand.heroImageUrl }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandDetailsPage({ params, searchParams }: BrandDetailsPageProps) {
  const { brandSlug } = await params;
  const query = searchParams ? await searchParams : undefined;
  const brand = await getCatalogBrandBySlug(brandSlug);

  if (!brand) {
    notFound();
  }

  const returnTo = query?.returnTo && query.returnTo.startsWith("/")
    ? query.returnTo
    : "/results?scope=products";

  const activeCategory = query?.category?.trim() ?? "all";
  const activeSort = (query?.sort as BrandSort) || "rating-desc";

  const filteredProducts = activeCategory === "all"
    ? brand.products
    : brand.products.filter((product) => product.category === activeCategory);
  const sortedProducts = sortProducts(filteredProducts, activeSort);

  const filterHref = (category: string, sort: BrandSort) => {
    const paramsObj = new URLSearchParams();
    paramsObj.set("returnTo", returnTo);
    paramsObj.set("sort", sort);
    if (category !== "all") {
      paramsObj.set("category", category);
    }
    return `/brand/${brand.slug}?${paramsObj.toString()}`;
  };

  return (
    <div className="py-10 lg:py-14">
      <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href={returnTo} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={14} />
            Back to results
          </Link>
          <span>/</span>
          <span>Brands</span>
          <span>/</span>
          <span className="text-foreground">{brand.name}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-3xl border border-border/80">
            <div className="relative aspect-square sm:aspect-5/4">
              {brand.heroImageUrl ? (
                <ImageWithFallback src={brand.heroImageUrl} alt={brand.name} className="h-full w-full object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Brand Profile</p>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{brand.name}</h1>
              <p className="text-base leading-relaxed text-muted-foreground">{getBrandDescription(brand.name, brand.categories)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm">
                <Star size={14} className="text-amber-500" />
                <span className="font-semibold">{brand.avgRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Price range: Rs {brand.minPrice.toLocaleString("en-IN")} - Rs {brand.maxPrice.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5"><ShieldCheck size={12} /> Verified source links</Badge>
              <Badge variant="outline" className="gap-1.5"><BadgeCheck size={12} /> Transparent catalog listing</Badge>
              <Badge variant="outline" className="gap-1.5"><Sparkles size={12} /> Curated for wellness</Badge>
            </div>

            {brand.websiteUrl ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Official domains</p>
                <div className="flex flex-wrap gap-2">
                  {brand.websiteUrl ? <Badge variant="secondary">{new URL(brand.websiteUrl).hostname}</Badge> : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <a href="#products" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">Products</a>
              <a href="#services" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">Services</a>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["rating-desc", "price-asc", "price-desc", "name-asc"] as BrandSort[]).map((sortKey) => (
                <Link
                  key={sortKey}
                  href={filterHref(activeCategory, sortKey)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${activeSort === sortKey ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "border-border hover:bg-muted"}`}
                >
                  {sortKey}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref("all", activeSort)}
              className={`rounded-full border px-3 py-1.5 text-xs ${activeCategory === "all" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "border-border hover:bg-muted"}`}
            >
              All categories
            </Link>
            {brand.categories.map((category) => (
              <Link
                key={category}
                href={filterHref(category, activeSort)}
                className={`rounded-full border px-3 py-1.5 text-xs ${activeCategory === category ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "border-border hover:bg-muted"}`}
              >
                {category}
              </Link>
            ))}
          </div>
        </section>

        <section id="products" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          {sortedProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden rounded-2xl border border-border/80">
                  <div className="aspect-4/3 overflow-hidden">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
                      <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)} rating</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
                    <p className="text-sm font-semibold">Rs {product.price.toLocaleString("en-IN")}</p>
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/product/${product.id}?returnTo=${encodeURIComponent(`/brand/${brand.slug}`)}`}
                        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                      >
                        View details
                      </Link>
                      {product.externalUrl ? (
                        <a
                          href={product.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                        >
                          Visit site
                          <ExternalLink size={12} className="ml-1.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No products matched this filter.
            </Card>
          )}
        </section>

        <section id="services" className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brand.categories.map((service) => (
              <Card key={service} className="rounded-2xl p-4 text-sm text-muted-foreground">
                {service}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
