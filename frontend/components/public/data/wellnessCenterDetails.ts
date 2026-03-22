import type { WolisticService } from "@/types/wolistic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

export type WellnessCenterDetail = WolisticService & {
  timings: string[];
  facilities: string[];
  programs: string[];
  specialists: string[];
  pricingRange: string;
  testimonials: Array<{ name: string; quote: string }>;
  gallery: string[];
};

function buildPricingRange(tags: string[]): string {
  const normalized = tags.join(" ").toLowerCase();
  if (normalized.includes("premium") || normalized.includes("advanced")) {
    return "Rs 2,500 - Rs 8,000 / month";
  }
  if (normalized.includes("budget") || normalized.includes("basic")) {
    return "Rs 800 - Rs 2,500 / month";
  }
  return "Rs 1,500 - Rs 5,000 / month";
}

export async function getWellnessCenterDetailById(centerId: string): Promise<WellnessCenterDetail | null> {
  const response = await fetch(`${API_BASE}/wellness-centers/${encodeURIComponent(centerId)}`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Unable to load wellness center (${response.status})`);
  }

  const raw = (await response.json()) as Record<string, unknown>;
  const center: WolisticService = {
    id: String(raw.id || ""),
    title: String(raw.title || ""),
    type: String(raw.type || ""),
    location: String(raw.location || ""),
    imageUrl: raw.image_url ? String(raw.image_url) : undefined,
    websiteName: raw.website_name ? String(raw.website_name) : undefined,
    websiteUrl: raw.website_url ? String(raw.website_url) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [],
  };

  const normalizedTags = center.tags.map((tag) => tag.trim()).filter(Boolean);
  const programs = Array.from(new Set(normalizedTags.map((tag) => `${tag} program`))).slice(0, 6);

  return {
    ...center,
    timings: [],
    facilities: [],
    programs,
    specialists: [],
    pricingRange: buildPricingRange(normalizedTags),
    testimonials: [],
    gallery: [center.imageUrl].filter((value): value is string => Boolean(value)),
  };
}
