import Link from "next/link";
import { Award, ChevronLeft, ChevronRight, ExternalLink, MapPin, TrendingUp, Users } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";

import {
  influencerResults,
  productResults,
  scopeOptions,
} from "./results-data";
import type { ResultsScope } from "./results-types";
import type { ProfessionalProfile } from "@/types/professional";

type ResultsGridProps = {
  scope: ResultsScope;
  returnTo: string;
  professionals: ProfessionalProfile[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    baseHref: string;
  };
};

function buildPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page);
    }
  }

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }

  return items;
}

export function ResultsGrid({ scope, returnTo, professionals, pagination }: ResultsGridProps) {
  if (scope === "professionals") {
    if (professionals.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching professionals found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Try adjusting your search with related keywords like nutrition, strength, stress, or mobility.
          </p>
        </div>
      );
    }

    const previousPageHref =
      pagination && pagination.currentPage > 1
        ? `${pagination.baseHref}&page=${pagination.currentPage - 1}`
        : null;
    const nextPageHref =
      pagination && pagination.currentPage < pagination.totalPages
        ? `${pagination.baseHref}&page=${pagination.currentPage + 1}`
        : null;

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {professionals.map((professional) => (
            <Link
              key={professional.id}
              href={`/${professional.username}?returnTo=${encodeURIComponent(returnTo)}`}
              className="group overflow-hidden rounded-[1.5rem] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <ImageWithFallback
                  src={professional.image}
                  alt={professional.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <PresenceChip isOnline={professional.isOnline} className="absolute left-3 top-3" />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{professional.name}</h3>
                    <p className="text-sm text-muted-foreground">{professional.specialization}</p>
                  </div>
                  <RatingChip value={professional.rating} textClassName="text-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {professional.category ? <Badge variant="secondary">{professional.category}</Badge> : null}
                  <StatusChip label="Certified" tone="certified" className="text-[11px]" />
                    {professional.membershipTier ? (
                    <Badge variant="outline" className="text-[11px]">
                      {professional.membershipTier}
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                    {professional.certifications.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <Award size={16} />
                        <span>
                          {professional.certifications
                            .map((certification) =>
                              typeof certification === "string" ? certification : certification.name,
                            )
                            .join(", ")}
                        </span>
                      </div>
                    ) : null}
                    {professional.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{professional.location}</span>
                      </div>
                    ) : null}
                </div>
                  {professional.approach ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">Approach: {professional.approach}</p>
                  ) : null}
                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </div>
            </Link>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
            {/* Previous */}
            {previousPageHref ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                asChild
              >
                <Link href={previousPageHref} aria-label="Previous page">
                  <ChevronLeft size={16} />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full opacity-30"
                disabled
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </Button>
            )}

            {/* Page pills */}
            {buildPageItems(pagination.currentPage, pagination.totalPages).map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-6 items-end justify-center pb-1 text-sm text-muted-foreground"
                  >
                    ···
                  </span>
                );
              }

              const pageHref = `${pagination.baseHref}&page=${item}`;
              const isActive = item === pagination.currentPage;

              return isActive ? (
                <span
                  key={item}
                  aria-current="page"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-sm"
                >
                  {item}
                </span>
              ) : (
                <Button
                  key={item}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  asChild
                >
                  <Link href={pageHref}>{item}</Link>
                </Button>
              );
            })}

            {/* Next */}
            {nextPageHref ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                asChild
              >
                <Link href={nextPageHref} aria-label="Next page">
                  <ChevronRight size={16} />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full opacity-30"
                disabled
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </Button>
            )}
          </nav>
        ) : null}
      </div>
    );
  }

  if (scope === "products") {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {productResults.map((product) => {
          let destinationDomain: string | null = null;

          if (product.externalUrl) {
            try {
              destinationDomain = new URL(product.externalUrl).hostname.replace(/^www\./, "");
            } catch {
              destinationDomain = null;
            }
          }

          return (
            <article
              key={product.id}
              className="group overflow-hidden rounded-[1.5rem] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                  <RatingChip value={product.rating} textClassName="text-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.isFeatured ? <StatusChip label="Featured" tone="featured" /> : null}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</p>
                    <p className="text-sm font-semibold tracking-tight">{product.brandName}</p>
                  </div>
                  <p className="text-xl font-semibold tracking-tight">₹{product.price}</p>
                </div>
                <Button className="w-full" variant="outline" asChild={Boolean(product.externalUrl)}>
                  {product.externalUrl ? (
                    <a href={product.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                      <ExternalLink size={14} className="mr-1.5" />
                      Visit Site
                    </a>
                  ) : (
                    <span>Link unavailable</span>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {destinationDomain
                    ? `Opens brand site: ${destinationDomain}`
                    : "Static product card preview for future marketplace results."}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  if (scope === "influencers") {
    return (
      <div className="space-y-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {influencerResults.map((influencer) => (
            <article
              key={influencer.id}
              className="group overflow-hidden rounded-[1.5rem] border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="aspect-square overflow-hidden">
                <ImageWithFallback
                  src={influencer.image}
                  alt={influencer.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{influencer.name}</h3>
                </div>
                <Badge variant="secondary">{influencer.focus}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={16} />
                  <span>
                    {new Intl.NumberFormat("en-US", { notation: "compact" }).format(influencer.followerCount)} followers
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{influencer.content}</p>
                <Button className="w-full" variant="outline">
                  Profile coming soon
                </Button>
              </div>
            </article>
          ))}
        </div>
        <section className="rounded-[2rem] border border-border/70 bg-accent/30 p-8 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight">Authentic Voices in Wellness</h2>
              <p className="text-lg text-muted-foreground">
                Our influencer results emphasize educators who build trust through clarity, evidence, and disclosure.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-500/15">
                  <TrendingUp className="text-cyan-600" size={24} />
                </div>
                <h3 className="mb-2 font-medium">Education-Focused</h3>
                <p className="text-sm text-muted-foreground">Content built around understanding, not sensationalism.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/15">
                  <Users className="text-blue-600" size={24} />
                </div>
                <h3 className="mb-2 font-medium">Transparent Partnerships</h3>
                <p className="text-sm text-muted-foreground">Commercial relationships are expected to be clearly signaled.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15">
                  <Award className="text-indigo-600" size={24} />
                </div>
                <h3 className="mb-2 font-medium">No False Claims</h3>
                <p className="text-sm text-muted-foreground">Discovery is framed around realistic expectations and responsible messaging.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const selectedScope = scopeOptions.find((scopeOption) => scopeOption.key === scope);

  return (
    <div className="rounded-[2rem] border border-dashed border-border p-10 text-center">
      <Badge variant="outline" className="mb-4 rounded-full px-3 py-1">
        Coming Soon
      </Badge>
      <h2 className="text-2xl font-semibold tracking-tight">{selectedScope?.label ?? "Results"} discovery is on the roadmap</h2>
      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
        This route already resolves the scope and renders a consistent shell. The data contract and search behavior can plug in later without redesigning the page.
      </p>
    </div>
  );
}