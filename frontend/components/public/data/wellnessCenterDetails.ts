import { getFeaturedWellnessCenters } from "@/components/public/data/wellnessCentersApi";
import type { WolisticService } from "@/types/wolistic";

export type WellnessCenterDetail = WolisticService & {
  timings: string[];
  facilities: string[];
  programs: string[];
  specialists: string[];
  pricingRange: string;
  testimonials: Array<{ name: string; quote: string }>;
  gallery: string[];
};

const DEFAULT_TIMINGS = [
  "Mon-Fri: 6:00 AM - 9:30 PM",
  "Saturday: 7:00 AM - 8:00 PM",
  "Sunday: 8:00 AM - 6:00 PM",
];

const DEFAULT_FACILITIES = [
  "Shower and changing rooms",
  "Filtered hydration station",
  "Clean equipment and sanitization protocol",
  "Beginner-friendly onboarding",
];

const DEFAULT_PROGRAMS = [
  "Guided mobility and recovery",
  "Mind-body wellness sessions",
  "Strength and posture routines",
  "Lifestyle and routine coaching",
];

const DEFAULT_SPECIALISTS = [
  "Certified movement coach",
  "Functional nutrition advisor",
  "Mindfulness facilitator",
];

const DEFAULT_TESTIMONIALS = [
  {
    name: "Ananya R.",
    quote: "The team made wellness feel practical and sustainable in my work schedule.",
  },
  {
    name: "Rohit M.",
    quote: "Clear guidance, consistent follow-up, and a welcoming center environment.",
  },
];

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
  const centers = await getFeaturedWellnessCenters(8);
  const center = centers.find((item) => item.id === centerId);

  if (!center) {
    return null;
  }

  const normalizedTags = center.tags.map((tag) => tag.trim()).filter(Boolean);
  const programs = normalizedTags.length > 0
    ? Array.from(new Set([...normalizedTags.map((tag) => `${tag} program`), ...DEFAULT_PROGRAMS])).slice(0, 6)
    : DEFAULT_PROGRAMS;

  return {
    ...center,
    timings: DEFAULT_TIMINGS,
    facilities: DEFAULT_FACILITIES,
    programs,
    specialists: DEFAULT_SPECIALISTS,
    pricingRange: buildPricingRange(normalizedTags),
    testimonials: DEFAULT_TESTIMONIALS,
    gallery: [center.imageUrl, center.imageUrl, center.imageUrl].filter((value): value is string => Boolean(value)),
  };
}
