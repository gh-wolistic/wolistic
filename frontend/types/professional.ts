/** Shared type for a professional profile as returned by the API. */

export type ProfessionalService = {
  name: string;
  duration: string;
  mode: string;
  price: number;
  session_count: number;
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

export type ReviewResponse = {
  id: number;
  reviewId: number;
  professionalId: string;
  responseText: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfessionalReview = {
  id: number;
  professionalId: string;
  reviewerUserId: string;
  reviewerName: string | null;
  reviewerEmail: string | null;
  rating: number;
  reviewText?: string;
  /** @deprecated Use reviewText */
  comment?: string;
  isVerified: boolean;
  verificationType: "verified_client" | "wolistic_user" | null;
  bookingId: number | null;
  serviceName: string | null;
  flaggedAt: string | null;
  flaggedByUserId: string | null;
  flagReason: string | null;
  moderationStatus: string | null;
  createdAt: string;
  response: ReviewResponse | null;
};

export type ReviewsSummary = {
  totalReviews: number;
  avgRating: number;
  verifiedCount: number;
  wolisticUserCount: number;
  responseRate: number;
};

export type ReviewPage = {
  items: ProfessionalReview[];
  total: number;
};

export type ReviewsListResponse = {
  reviews: ProfessionalReview[];
  summary: ReviewsSummary;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason: string | null;
  verificationType: "verified_client" | "wolistic_user" | null;
};

export type ExpertClient = {
  id: number;
  professionalId: string;
  clientUserId: string | null;
  clientName: string;
  clientEmail: string;
  serviceNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
