export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  category?: string;
  description?: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  price: number;
  rating: number;
  externalUrl?: string;
  isFeatured: boolean;
};

export type CatalogBrandSummary = {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  heroImageUrl?: string;
  productCount: number;
  avgRating: number;
  minPrice: number;
  maxPrice: number;
  categories: string[];
};

export type CatalogBrandDetail = {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  heroImageUrl?: string;
  websiteUrl?: string;
  description?: string;
  products: CatalogProduct[];
  categories: string[];
  avgRating: number;
  minPrice: number;
  maxPrice: number;
};

export type CatalogService = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  serviceType?: string;
  accreditationBody?: string;
  location?: string;
  eligibility?: string;
  duration?: string;
  deliveryFormat?: string;
  fees?: string;
  verificationMethod?: string;
  focusAreas: string[];
  applyUrl?: string;
  description?: string;
};

export type CatalogInfluencer = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  focus?: string;
  followerCount: number;
  contentSummary?: string;
  profileUrl?: string;
};
