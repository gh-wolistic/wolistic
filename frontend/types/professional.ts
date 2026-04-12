/** Shared type for a professional profile as returned by the API. */

export type ProfessionalService = {
  name: string;
  duration: string;
  mode: string;
  price: number;
  offers?: string;
  negotiable?: boolean;
  offer_type?: string;
  offer_label?: string;
  offer_value?: number;
};

export type ProfessionalCertification = {
  name: string;
  issuer?: string;
  issuedYear?: number;
};

export type ProfessionalCertificationInput = string | ProfessionalCertification;

export type ProfessionalApproach = {
  title: string;
  description?: string;
};

export type ProfessionalExpertiseArea = {
  title: string;
  description?: string;
};

export type ProfessionalServiceArea = {
  city_name: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  is_primary: boolean;
};

export type SocialLinks = {
  website?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  [key: string]: string | undefined;
};

export type ProfessionalProfile = {
  id: string;
  username: string;
  name: string;
  specialization: string;
  category?: string;
  location?: string;
  image?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  experience?: string;
  experienceYears: number;
  shortBio?: string;
  about?: string;
  membershipTier?: string;
  profileCompleteness: number;
  isOnline: boolean;
  placementLabel?: string;

  // Extended fields
  pronouns?: string;
  whoIWorkWith?: string;
  clientGoals?: string[];
  responseTimeHours?: number;
  cancellationHours?: number;
  socialLinks?: SocialLinks;
  videoIntroUrl?: string;

  // Structured child data
  approaches?: ProfessionalApproach[];
  /** @deprecated Use approaches[]. Kept for search ranking compatibility. */
  approach?: string;
  availability?: string;
  certifications: ProfessionalCertificationInput[];
  expertiseAreas?: ProfessionalExpertiseArea[];
  /** @deprecated Use expertiseAreas[]. Kept for compatibility. */
  specializations: string[];
  education: string[];
  languages: string[];
  sessionTypes: string[];
  subcategories: string[];
  gallery: string[];
  services: ProfessionalService[];
  serviceAreas?: ProfessionalServiceArea[];
  featuredProducts: FeaturedProduct[];
};

export type FeaturedProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
};

export type ProfessionalReview = {
  id: number;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type ReviewPage = {
  items: ProfessionalReview[];
  total: number;
};
