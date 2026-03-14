export type ResultsScope =
  | "professionals"
  | "products"
  | "influencers"
  | "brands"
  | "services"
  | "wellness-centers";

export type ScopeOption = {
  key: ResultsScope;
  label: string;
  description: string;
  isReady: boolean;
};

export type ProfessionalResultCard = {
  id: string;
  username: string;
  name: string;
  image: string;
  specialization: string;
  category: string;
  rating: number;
  location: string;
  approach: string;
  certifications: string[];
  membershipLabel?: string;
  isOnline: boolean;
};

export type ProductResultCard = {
  id: string;
  name: string;
  image: string;
  category: string;
  description: string;
  brandName: string;
  rating: number;
  price: number;
  isFeatured?: boolean;
  externalUrl?: string;
};

export type InfluencerResultCard = {
  id: string;
  name: string;
  image: string;
  focus: string;
  followerCount: number;
  content: string;
};

export type CertificateProviderResultCard = {
  id: string;
  name: string;
  image: string;
  accreditationBody: string;
  eligibility: string;
  duration: string;
  format: string;
  fees: string;
  verificationMethod: string;
  focusAreas: string[];
  applyUrl?: string;
};