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
    email: (raw.email as string) ?? undefined,
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProfessionalByUsername(
  username: string,
): Promise<ProfessionalProfile | null> {
  const res = await fetch(`${API_BASE}/professionals/${encodeURIComponent(username)}`, {
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

export type { ProfessionalReview };
