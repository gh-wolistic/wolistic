/**
 * Data-layer for fetching featured wellness centers from the FastAPI backend.
 */

import type { WolisticService } from "@/types/wolistic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

function toCamelWellnessCenter(raw: Record<string, unknown>): WolisticService {
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

export async function getFeaturedWellnessCenters(limit = 8): Promise<WolisticService[]> {
  const safeLimit = Math.min(limit, 8);
  const res = await fetch(
    `${API_BASE}/wellness-centers/featured?limit=${encodeURIComponent(String(safeLimit))}`,
    {
      cache: "force-cache",
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const items = (await res.json()) as Record<string, unknown>[];
  return items.map(toCamelWellnessCenter);
}