/**
 * Data-layer for fetching professional profiles from the FastAPI backend.
 * Used by both server components (generateMetadata) and client components (reviews).
 */

import type {
  ProfessionalCertification,
  ProfessionalCertificationInput,
  ProfessionalProfile,
  ProfessionalReview,
  ReviewPage,
} from "@/types/professional";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Response → camelCase mapper
// ---------------------------------------------------------------------------

function toCamelProfile(raw: Record<string, unknown>): ProfessionalProfile {
  const certifications = ((raw.certifications as unknown[]) ?? []).map(
    (cert): ProfessionalCertificationInput => {
      if (typeof cert === "string") {
        return cert;
      }

      const certification = cert as Record<string, unknown>;

      return {
        name: (certification.name as string) ?? "",
        issuer: (certification.issuer as string | null) ?? undefined,
        issuedYear: (certification.issued_year as number | null) ?? undefined,
      } satisfies ProfessionalCertification;
    },
  );

  return {
    id: raw.id as string,
    username: raw.username as string,
    name: raw.name as string,
    specialization: raw.specialization as string,
    category: (raw.category as string) ?? undefined,
    location: (raw.location as string) ?? undefined,
    image: (raw.image as string) ?? undefined,
    coverImage: (raw.cover_image as string) ?? undefined,
    rating: raw.rating as number,
    reviewCount: raw.review_count as number,
    experience: (raw.experience as string) ?? undefined,
    experienceYears: raw.experience_years as number,
    shortBio: (raw.short_bio as string) ?? undefined,
    about: (raw.about as string) ?? undefined,
    membershipTier: (raw.membership_tier as string) ?? undefined,
    isOnline: raw.is_online as boolean,
    placementLabel: (raw.placement_label as string) ?? undefined,
    approach: (raw.approach as string) ?? undefined,
    availability: (raw.availability as string) ?? undefined,
    certifications,
    specializations: (raw.specializations as string[]) ?? [],
    education: (raw.education as string[]) ?? [],
    languages: (raw.languages as string[]) ?? [],
    sessionTypes: (raw.session_types as string[]) ?? [],
    subcategories: (raw.subcategories as string[]) ?? [],
    gallery: (raw.gallery as string[]) ?? [],
    services: ((raw.services as Record<string, unknown>[]) ?? []).map((s) => ({
      name: s.name as string,
      duration: s.duration as string,
      mode: s.mode as string,
      price: s.price as number,
      offers: (s.offers as string) ?? undefined,
      negotiable: (s.negotiable as boolean) ?? undefined,
      offer_type: (s.offer_type as string) ?? undefined,
      offer_label: (s.offer_label as string) ?? undefined,
      offer_value: (s.offer_value as number) ?? undefined,
    })),
    featuredProducts: (raw.featured_products as ProfessionalProfile["featuredProducts"]) ?? [],
  };
}

function toCamelReview(raw: Record<string, unknown>): ProfessionalReview {
  return {
    id: raw.id as number,
    reviewerName: raw.reviewer_name as string,
    rating: raw.rating as number,
    comment: (raw.comment as string) ?? undefined,
    createdAt: raw.created_at as string,
  };
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function filterAndRankProfilesLocally(items: ProfessionalProfile[], query: string, limit: number): ProfessionalProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items.slice(0, limit);
  }

  const queryTokens = tokenize(q);
  const aliases = new Set(queryTokens);
  if (aliases.has("sara")) aliases.add("sarah");
  if (aliases.has("sarah")) aliases.add("sara");
  if (aliases.has("diet")) aliases.add("nutrition");
  if (aliases.has("nutrition")) aliases.add("diet");
  if (aliases.has("strength")) {
    aliases.add("conditioning");
    aliases.add("fitness");
    aliases.add("training");
  }

  const scored = items
    .map((profile) => {
      const haystack = [
        profile.name,
        profile.username,
        profile.specialization,
        profile.category,
        profile.shortBio,
        profile.about,
        profile.approach,
        ...(profile.subcategories ?? []),
        ...(profile.specializations ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const token of aliases) {
        if (token.length < 3) {
          continue;
        }
        if (haystack.includes(token)) {
          score += 1;
        }
      }

      if (score < 1) {
        return null;
      }

      return {
        profile,
        score: score + (profile.rating || 0) * 0.05,
      };
    })
    .filter((value): value is { profile: ProfessionalProfile; score: number } => value !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.profile);

  return scored;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProfessionalByUsername(
  username: string,
): Promise<ProfessionalProfile | null> {
  const res = await fetch(`${API_BASE}/professionals/${encodeURIComponent(username)}`, {
    cache: "force-cache",
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return toCamelProfile(await res.json());
}

export async function getProfessionalById(
  id: string,
): Promise<ProfessionalProfile | null> {
  // Step 1: resolve UUID → username
  const usernameRes = await fetch(`${API_BASE}/professionals/by-id/${id}`, {
    cache: "force-cache",
    next: { revalidate: 60 },
  });
  if (usernameRes.status === 404) return null;
  if (!usernameRes.ok) throw new Error(`API error ${usernameRes.status}`);
  const { username } = (await usernameRes.json()) as { username: string };

  // Step 2: fetch full profile
  return getProfessionalByUsername(username);
}

export async function getProfessionalReviews(
  professionalId: string,
  opts: { limit: number; offset: number },
): Promise<ReviewPage> {
  const params = new URLSearchParams({
    limit: String(opts.limit),
    offset: String(opts.offset),
  });
  const res = await fetch(
    `${API_BASE}/professionals/${professionalId}/reviews?${params}`,
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as { items: Record<string, unknown>[]; total: number };
  return {
    items: data.items.map(toCamelReview),
    total: data.total,
  };
}

export async function getFeaturedProfessionals(limit = 8): Promise<ProfessionalProfile[]> {
  const safeLimit = Math.min(limit, 8);
  const res = await fetch(`${API_BASE}/professionals/featured?limit=${encodeURIComponent(String(safeLimit))}`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const items = (await res.json()) as Record<string, unknown>[];
  return items.map(toCamelProfile);
}

export async function getFeaturedProfessionalsNearby(
  lat: number,
  lng: number,
  opts?: { limit?: number; radiusKm?: number },
): Promise<ProfessionalProfile[]> {
  const safeLimit = Math.min(Math.max(opts?.limit ?? 8, 1), 8);
  const safeRadiusKm = Math.min(Math.max(opts?.radiusKm ?? 300, 1), 3000);

  const params = new URLSearchParams({
    limit: String(safeLimit),
    lat: String(lat),
    lng: String(lng),
    radius_km: String(safeRadiusKm),
  });

  const res = await fetch(`${API_BASE}/professionals/featured?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const items = (await res.json()) as Record<string, unknown>[];
  return items.map(toCamelProfile);
}

export async function searchProfessionals(query: string, limit = 24): Promise<ProfessionalProfile[]> {
  const safeLimit = Math.max(1, limit);
  const params = new URLSearchParams({
    q: query,
    limit: String(safeLimit),
  });

  const res = await fetch(`${API_BASE}/professionals/search?${params.toString()}`, {
    cache: "force-cache",
    next: { revalidate: 60 },
  });
  if (res.ok) {
    const items = (await res.json()) as Record<string, unknown>[];
    return items.map(toCamelProfile);
  }

  // Compatibility fallback while /professionals/search is not deployed.
  if (res.status === 404) {
    const featuredLimit = Math.min(Math.max(safeLimit, 8), 20);
    const fallback = await fetch(
      `${API_BASE}/professionals/featured?limit=${encodeURIComponent(String(featuredLimit))}`,
      { cache: "force-cache", next: { revalidate: 60 } },
    );
    if (!fallback.ok) {
      return [];
    }

    const items = (await fallback.json()) as Record<string, unknown>[];
    const profiles = items.map(toCamelProfile);
    return filterAndRankProfilesLocally(profiles, query, safeLimit);
  }

  throw new Error(`API error ${res.status}`);
}

export type { ProfessionalReview };
