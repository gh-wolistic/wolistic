/**
 * Data-layer for fetching Wolistic product data from the FastAPI backend.
 */

import type { Product } from "@/types/wolistic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

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

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const safeLimit = Math.min(limit, 8);
  const res = await fetch(
    `${API_BASE}/products/featured?limit=${encodeURIComponent(String(safeLimit))}`,
    {
      cache: "force-cache",
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const items = (await res.json()) as Record<string, unknown>[];
  return items.map(toCamelProduct);
}
