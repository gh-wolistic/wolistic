/**
 * Data layer for the Wolistic multi-category search (scope=wolistic).
 */

import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticArticle, WolisticSearchResult, WolisticService } from "@/types/wolistic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api/v1";

function toCamelProfessional(raw: Record<string, unknown>): ProfessionalProfile {
  return {
    id: raw.id as string,
    username: raw.username as string,
    name: raw.name as string,
    specialization: raw.specialization as string,
    category: (raw.category as string) ?? undefined,
    location: (raw.location as string) ?? undefined,
    image: (raw.image as string) ?? undefined,
    coverImage: (raw.cover_image as string) ?? undefined,
    rating: (raw.rating as number) ?? 0,
    reviewCount: (raw.review_count as number) ?? 0,
    experience: (raw.experience as string) ?? undefined,
    experienceYears: (raw.experience_years as number) ?? 0,
    shortBio: (raw.short_bio as string) ?? undefined,
    about: (raw.about as string) ?? undefined,
    membershipTier: (raw.membership_tier as string) ?? undefined,
    profileCompleteness: (raw.profile_completeness as number) ?? 0,
    isOnline: (raw.is_online as boolean) ?? false,
    approach: (raw.approach as string) ?? undefined,
    availability: (raw.availability as string) ?? undefined,
    certifications: (raw.certifications as []) ?? [],
    specializations: (raw.specializations as string[]) ?? [],
    education: (raw.education as string[]) ?? [],
    languages: (raw.languages as string[]) ?? [],
    sessionTypes: (raw.session_types as string[]) ?? [],
    subcategories: (raw.subcategories as string[]) ?? [],
    gallery: (raw.gallery as string[]) ?? [],
    services: (raw.services as []) ?? [],
    featuredProducts: (raw.featured_products as []) ?? [],
  };
}

function toCamelProduct(raw: Record<string, unknown>): Product {
  return {
    id: raw.id as string,
    name: raw.name as string,
    image: (raw.image as string) ?? undefined,
    category: (raw.category as string) ?? undefined,
    brand: (raw.brand as string) ?? undefined,
    websiteName: (raw.website_name as string) ?? undefined,
    websiteUrl: (raw.website_url as string) ?? undefined,
    description: (raw.description as string) ?? undefined,
    price: (raw.price as number) ?? 0,
  };
}

function toCamelService(raw: Record<string, unknown>): WolisticService {
  return {
    id: raw.id as string,
    title: raw.title as string,
    type: raw.type as string,
    location: raw.location as string,
    imageUrl: (raw.image_url as string) ?? undefined,
    websiteName: (raw.website_name as string) ?? undefined,
    websiteUrl: (raw.website_url as string) ?? undefined,
    tags: (raw.tags as string[]) ?? [],
  };
}

function toCamelArticle(raw: Record<string, unknown>): WolisticArticle {
  return {
    id: raw.id as string,
    title: raw.title as string,
    readTime: (raw.read_time as string) ?? "5 min read",
  };
}

export async function wolisticSearch(
  query: string,
  limit = 6,
): Promise<WolisticSearchResult> {
  const safeLimit = Math.min(Math.max(1, limit), 20);
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(safeLimit),
  });

  const res = await fetch(`${API_BASE}/ai/wolistic-search?${params}`, {
    cache: "force-cache",
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Wolistic search failed: ${res.status}`);
  }

  const data = (await res.json()) as Record<string, unknown[]>;

  return {
    professionals: ((data.professionals as Record<string, unknown>[]) ?? []).map(
      toCamelProfessional,
    ),
    products: ((data.products as Record<string, unknown>[]) ?? []).map(toCamelProduct),
    services: ((data.services as Record<string, unknown>[]) ?? []).map(toCamelService),
    articles: ((data.articles as Record<string, unknown>[]) ?? []).map(toCamelArticle),
  };
}
