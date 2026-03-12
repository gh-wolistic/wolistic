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

export type ProfessionalProfile = {
  id: string;
  username: string;
  name: string;
  email?: string;
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
  isOnline: boolean;

  approach?: string;
  availability?: string;
  certifications: ProfessionalCertificationInput[];
  specializations: string[];
  education: string[];
  languages: string[];
  sessionTypes: string[];
  subcategories: string[];
  gallery: string[];
  services: ProfessionalService[];
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
