import type {
  CatalogBrandDetail,
  CatalogBrandSummary,
  CatalogInfluencer,
  CatalogProduct,
  CatalogService,
} from "@/types/catalog";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown): string | undefined {
  const text = asString(value).trim();
  return text ? text : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toProduct(raw: Record<string, unknown>): CatalogProduct {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    imageUrl: asOptionalString(raw.image_url),
    category: asOptionalString(raw.category),
    description: asOptionalString(raw.description),
    brandId: asString(raw.brand_id),
    brandName: asString(raw.brand_name),
    brandSlug: asString(raw.brand_slug),
    price: asNumber(raw.price, 0),
    rating: asNumber(raw.rating, 0),
    externalUrl: asOptionalString(raw.external_url),
    isFeatured: Boolean(raw.is_featured),
  };
}

function toBrandSummary(raw: Record<string, unknown>): CatalogBrandSummary {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    logoUrl: asOptionalString(raw.logo_url),
    heroImageUrl: asOptionalString(raw.hero_image_url),
    productCount: asNumber(raw.product_count, 0),
    avgRating: asNumber(raw.avg_rating, 0),
    minPrice: asNumber(raw.min_price, 0),
    maxPrice: asNumber(raw.max_price, 0),
    categories: Array.isArray(raw.categories) ? raw.categories.map((item) => String(item)) : [],
  };
}

function toBrandDetail(raw: Record<string, unknown>): CatalogBrandDetail {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    logoUrl: asOptionalString(raw.logo_url),
    heroImageUrl: asOptionalString(raw.hero_image_url),
    websiteUrl: asOptionalString(raw.website_url),
    description: asOptionalString(raw.description),
    products: Array.isArray(raw.products)
      ? raw.products.map((item) => toProduct(item as Record<string, unknown>))
      : [],
    categories: Array.isArray(raw.categories) ? raw.categories.map((item) => String(item)) : [],
    avgRating: asNumber(raw.avg_rating, 0),
    minPrice: asNumber(raw.min_price, 0),
    maxPrice: asNumber(raw.max_price, 0),
  };
}

function toService(raw: Record<string, unknown>): CatalogService {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    imageUrl: asOptionalString(raw.image_url),
    serviceType: asOptionalString(raw.service_type),
    accreditationBody: asOptionalString(raw.accreditation_body),
    location: asOptionalString(raw.location),
    eligibility: asOptionalString(raw.eligibility),
    duration: asOptionalString(raw.duration),
    deliveryFormat: asOptionalString(raw.delivery_format),
    fees: asOptionalString(raw.fees),
    verificationMethod: asOptionalString(raw.verification_method),
    focusAreas: Array.isArray(raw.focus_areas) ? raw.focus_areas.map((item) => String(item)) : [],
    applyUrl: asOptionalString(raw.apply_url),
    description: asOptionalString(raw.description),
  };
}

function toInfluencer(raw: Record<string, unknown>): CatalogInfluencer {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    imageUrl: asOptionalString(raw.image_url),
    focus: asOptionalString(raw.focus),
    followerCount: asNumber(raw.follower_count, 0),
    contentSummary: asOptionalString(raw.content_summary),
    profileUrl: asOptionalString(raw.profile_url),
  };
}

async function getJson<T>(url: string, revalidateSeconds = 60): Promise<T> {
  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Catalog API failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function getCatalogProducts(input: {
  query?: string;
  category?: string;
  brandSlug?: string;
  limit?: number;
}): Promise<CatalogProduct[]> {
  const params = new URLSearchParams();
  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.category?.trim()) params.set("category", input.category.trim());
  if (input.brandSlug?.trim()) params.set("brand_slug", input.brandSlug.trim());
  params.set("limit", String(input.limit ?? 60));

  const items = await getJson<Record<string, unknown>[]>(`${API_BASE}/catalog/products?${params.toString()}`);
  return items.map(toProduct);
}

export async function getCatalogProductById(productId: string): Promise<CatalogProduct | null> {
  try {
    const item = await getJson<Record<string, unknown>>(`${API_BASE}/catalog/products/${encodeURIComponent(productId)}`);
    return toProduct(item);
  } catch {
    return null;
  }
}

export async function getCatalogBrands(input: { query?: string; limit?: number }): Promise<CatalogBrandSummary[]> {
  const params = new URLSearchParams();
  if (input.query?.trim()) params.set("q", input.query.trim());
  params.set("limit", String(input.limit ?? 60));

  const items = await getJson<Record<string, unknown>[]>(`${API_BASE}/catalog/brands?${params.toString()}`);
  return items.map(toBrandSummary);
}

export async function getCatalogBrandBySlug(slug: string): Promise<CatalogBrandDetail | null> {
  try {
    const item = await getJson<Record<string, unknown>>(`${API_BASE}/catalog/brands/${encodeURIComponent(slug)}`);
    return toBrandDetail(item);
  } catch {
    return null;
  }
}

export async function getCatalogServices(input: { query?: string; limit?: number }): Promise<CatalogService[]> {
  const params = new URLSearchParams();
  if (input.query?.trim()) params.set("q", input.query.trim());
  params.set("limit", String(input.limit ?? 60));

  const items = await getJson<Record<string, unknown>[]>(`${API_BASE}/catalog/services?${params.toString()}`);
  return items.map(toService);
}

export async function getCatalogServiceById(serviceId: string): Promise<CatalogService | null> {
  try {
    const item = await getJson<Record<string, unknown>>(`${API_BASE}/catalog/services/${encodeURIComponent(serviceId)}`);
    return toService(item);
  } catch {
    return null;
  }
}

export async function getCatalogInfluencers(input: { query?: string; limit?: number }): Promise<CatalogInfluencer[]> {
  const params = new URLSearchParams();
  if (input.query?.trim()) params.set("q", input.query.trim());
  params.set("limit", String(input.limit ?? 60));

  const items = await getJson<Record<string, unknown>[]>(`${API_BASE}/catalog/influencers?${params.toString()}`);
  return items.map(toInfluencer);
}
