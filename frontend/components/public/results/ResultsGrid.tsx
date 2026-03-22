import Link from "next/link";
import {
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Stethoscope,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PresenceChip, RatingChip, StatusChip } from "@/components/ui";
import { getRoleAccentFromProfessional } from "@/lib/professionalRoleAccent";
import type {
  CatalogBrandSummary,
  CatalogInfluencer,
  CatalogProduct,
  CatalogService,
} from "@/types/catalog";
import type { ProfessionalProfile } from "@/types/professional";
import type { WolisticService } from "@/types/wolistic";

import {
  scopeOptions,
} from "@/components/public/results/results-data";
import type { ResultsScope } from "./results-types";

type ResultsGridProps = {
  scope: ResultsScope;
  query: string;
  returnTo: string;
  professionals: ProfessionalProfile[];
  wellnessCenters: WolisticService[];
  products: CatalogProduct[];
  brands: CatalogBrandSummary[];
  services: CatalogService[];
  influencers: CatalogInfluencer[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    baseHref: string;
  };
};

function getSessionTypeVisual(sessionType: string) {
  const normalized = sessionType.trim().toLowerCase();
  const normalizedWords = normalized.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (
    normalizedWords.includes("in person")
    || normalizedWords.includes("inperson")
    || normalizedWords.includes("offline")
    || normalizedWords.includes("onsite")
  ) {
    return { label: "In-person", icon: MapPin };
  }

  if (normalizedWords.includes("video") || normalizedWords.includes("online") || normalizedWords.includes("virtual")) {
    return { label: "Video call", icon: Video };
  }

  if (
    normalizedWords.includes("phone")
    || normalizedWords.includes("audio")
    || normalizedWords.includes("voice")
  ) {
    return { label: "Phone", icon: Phone };
  }

  if (normalizedWords.includes("chat") || normalizedWords.includes("message") || normalizedWords.includes("text")) {
    return { label: "Chat", icon: MessageCircle };
  }

  if (normalizedWords.includes("group")) {
    return { label: "Group", icon: Users };
  }

  return { label: sessionType, icon: Video };
}

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

export function ResultsGrid({
  scope,
  query,
  returnTo,
  professionals,
  wellnessCenters,
  products,
  brands,
  services,
  influencers,
  pagination,
}: ResultsGridProps) {
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {professionals.map((professional) => {
            const roleAccent = getRoleAccentFromProfessional(professional);
            const membershipTier = String(professional.membershipTier || "").trim().toLowerCase();
            const isElite = membershipTier === "elite";

            return (
            <Link
              key={professional.id}
              href={`/${professional.username}?returnTo=${encodeURIComponent(returnTo)}`}
              className={`group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 ${roleAccent.cardClass} ${isElite ? "shadow-[0_0_0_1px_rgba(217,119,6,0.25)] dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2)]" : ""}`}
            >
              {isElite ? (
                <span className="pointer-events-none absolute -right-12 top-4 z-30 rotate-45 rounded-sm border border-amber-200/40 bg-amber-100/85 px-12 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900 dark:border-amber-300/35 dark:bg-amber-300/20 dark:text-amber-100">
                  Elite
                </span>
              ) : null}
              <div className="relative aspect-4/3 overflow-hidden">
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
                    <Badge variant="outline" className={`${roleAccent.badgeClass}`}>
                      {roleAccent.label}
                    </Badge>
                    {professional.category ? <Badge variant="secondary">{professional.category}</Badge> : null}
                    {professional.placementLabel === "Boosted" ? (
                      <Badge variant="outline" className="border-amber-400/60 text-amber-200">
                        Boosted
                      </Badge>
                    ) : null}
                    {professional.membershipTier ? <StatusChip label={professional.membershipTier} tone={isElite ? "elite" : "featured"} /> : null}
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

                {professional.languages.length > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe size={14} />
                    <span>Languages: {professional.languages.join(", ")}</span>
                  </div>
                ) : null}

                {professional.sessionTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {professional.sessionTypes.map((sessionType) => {
                      const visual = getSessionTypeVisual(sessionType);
                      const Icon = visual.icon;

                      return (
                        <Badge key={sessionType} variant="outline" className="gap-1.5 text-[11px]">
                          <Icon size={12} />
                          {visual.label}
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}


                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </div>
            </Link>
            );
          })}
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
    if (products.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching products found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Try changing your query or filters.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
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
              className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <Link
                href={`/product/${product.id}?returnTo=${encodeURIComponent(returnTo)}`}
                aria-label={`Open details for ${product.name}`}
                className="absolute inset-0 z-10"
              />
              <div className="aspect-5/5 overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="relative z-20 space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                  <RatingChip value={product.rating} textClassName="text-sm" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
                  {product.isFeatured ? <StatusChip label="Featured" tone="featured" /> : null}
                </div>
                {product.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                ) : null}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</p>
                    <Link
                      href={`/brand/${product.brandSlug}?returnTo=${encodeURIComponent(returnTo)}`}
                      className="relative z-30 text-sm font-semibold tracking-tight hover:underline"
                    >
                      {product.brandName}
                    </Link>
                  </div>
                  <p className="text-xl font-semibold tracking-tight">₹{product.price}</p>
                </div>
                <Button className="relative z-30 w-full" variant="outline" asChild={Boolean(product.externalUrl)}>
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
                    : "Catalog product listing from backend."}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  if (scope === "brands") {
    if (brands.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching brands found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
             Try searching by name or brand keyword.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {brands.map((brand) => {
          const categoriesLabel = brand.categories.slice(0, 2).join(" • ");

          return (
            <Link
              key={brand.slug}
              href={`/brand/${brand.slug}?returnTo=${encodeURIComponent(returnTo)}`}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="aspect-5/3 overflow-hidden bg-muted">
                {brand.heroImageUrl ? (
                  <ImageWithFallback
                    src={brand.heroImageUrl}
                    alt={brand.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 size={28} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold tracking-tight">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground">{categoriesLabel || "Wellness products"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{brand.productCount} products</Badge>
                  <Badge variant="outline">{brand.avgRating.toFixed(1)} rating</Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  Price range: ₹{brand.minPrice.toLocaleString("en-IN")} - ₹{brand.maxPrice.toLocaleString("en-IN")}
                </div>

                <Button className="w-full" variant="outline">
                  View Brand
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  if (scope === "wellness-centers") {
    if (wellnessCenters.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching wellness centers found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Try searching by city, center type, or offering tags.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {wellnessCenters.map((center) => (
          <article
            key={center.id}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
          >
            <Link
              href={`/wellness-center/${center.id}?returnTo=${encodeURIComponent(returnTo)}`}
              aria-label={`Open details for ${center.title}`}
              className="absolute inset-0 z-10"
            />

            <div className="aspect-5/3 overflow-hidden bg-muted">
              {center.imageUrl ? (
                <ImageWithFallback
                  src={center.imageUrl}
                  alt={center.title}
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
                <h3 className="text-lg font-semibold tracking-tight">{center.title}</h3>
                <p className="text-sm text-muted-foreground">{center.type}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span>{center.location}</span>
              </div>

              {center.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {center.tags.slice(0, 4).map((tag) => (
                    <Badge key={`${center.id}-${tag}`} variant="outline" className="text-[11px] capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Button className="w-full" variant="outline">
                View Center
              </Button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (scope === "services") {
    if (services.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching services found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Try searching by provider, accreditation, format, or focus area.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.id}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
          >
            <Link
              href={`/certificate-provider/${service.id}?returnTo=${encodeURIComponent(returnTo)}`}
              aria-label={`Open details for ${service.name}`}
              className="absolute inset-0 z-10"
            />

            <div className="aspect-5/3 overflow-hidden bg-muted">
              <ImageWithFallback
                src={service.imageUrl}
                alt={service.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>

            <div className="relative z-20 space-y-4 p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.accreditationBody || service.serviceType}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {service.deliveryFormat ? <Badge variant="secondary">{service.deliveryFormat}</Badge> : null}
                {service.duration ? <Badge variant="outline">{service.duration}</Badge> : null}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {service.eligibility ? <p>Eligibility: {service.eligibility}</p> : null}
                {service.fees ? <p>Fees: {service.fees}</p> : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {service.focusAreas.slice(0, 3).map((area) => (
                  <Badge key={`${service.id}-${area}`} variant="outline" className="text-[11px]">
                    {area}
                  </Badge>
                ))}
              </div>

              <Button className="w-full" variant="outline">
                View Provider
              </Button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (scope === "influencers") {
    if (influencers.length < 1) {
      return (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No matching influencers found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Try a different query.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {influencers.map((influencer) => (
            <article
              key={influencer.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div className="aspect-square overflow-hidden">
                <ImageWithFallback
                  src={influencer.imageUrl}
                  alt={influencer.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{influencer.name}</h3>
                </div>
                {influencer.focus ? <Badge variant="secondary">{influencer.focus}</Badge> : null}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={16} />
                  <span>
                    {new Intl.NumberFormat("en-US", { notation: "compact" }).format(influencer.followerCount)} followers
                  </span>
                </div>
                {influencer.contentSummary ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{influencer.contentSummary}</p>
                ) : null}
                <Button className="w-full" variant="outline" asChild={Boolean(influencer.profileUrl)}>
                  {influencer.profileUrl ? (
                    <a href={influencer.profileUrl} target="_blank" rel="noopener noreferrer nofollow">
                      Open profile
                    </a>
                  ) : (
                    <span>Profile coming soon</span>
                  )}
                </Button>
              </div>
            </article>
          ))}
        </div>
        <section className="rounded-3xl border border-border/70 bg-accent/30 p-8 lg:p-10">
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
    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
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