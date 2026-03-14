import { productResults } from "./results-data";
import type { ProductResultCard } from "./results-types";

export type BrandView = {
  slug: string;
  name: string;
  products: ProductResultCard[];
  categories: string[];
  avgRating: number;
  minPrice: number;
  maxPrice: number;
  websiteDomains: string[];
  heroImage?: string;
  services: string[];
};

const CATEGORY_SERVICE_MAP: Record<string, string[]> = {
  Supplements: ["Personalized supplement guidance", "Ingredient transparency notes"],
  "Fitness Equipment": ["Home setup recommendations", "Routine compatibility guidance"],
  "Accessories & Lifestyle": ["Lifestyle routine planning", "Sleep and recovery ritual support"],
  "Recovery Equipment": ["Mobility and recovery planning", "Post-workout recovery guidance"],
};

export function slugifyBrandName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getWebsiteDomain(url?: string): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getBrandBySlug(slug: string): BrandView | null {
  const products = productResults.filter((product) => slugifyBrandName(product.brandName) === slug);

  if (products.length < 1) {
    return null;
  }

  const name = products[0].brandName;
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const avgRating = products.reduce((sum, product) => sum + product.rating, 0) / products.length;
  const prices = products.map((product) => product.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const websiteDomains = Array.from(
    new Set(
      products
        .map((product) => getWebsiteDomain(product.externalUrl))
        .filter((domain): domain is string => Boolean(domain)),
    ),
  );
  const services = Array.from(
    new Set(
      categories.flatMap((category) => CATEGORY_SERVICE_MAP[category] ?? ["Wellness product recommendations"]),
    ),
  );

  return {
    slug,
    name,
    products,
    categories,
    avgRating,
    minPrice,
    maxPrice,
    websiteDomains,
    heroImage: products[0]?.image,
    services,
  };
}
