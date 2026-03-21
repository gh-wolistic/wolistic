export type HolisticTeamProfessionalCard = {
  id: string;
  username: string;
  name: string;
  specialization: string;
  category?: string;
  location?: string;
  image?: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  membershipTier?: string;
  isOnline: boolean;
};

export type HolisticTeamMember = {
  role: string;
  sessionsIncluded: number;
  professional: HolisticTeamProfessionalCard;
};

export type HolisticTeam = {
  id: string;
  name?: string;
  sourceType: string;
  scope: string;
  queryTag?: string;
  keywords: string[];
  pricingAmount: number;
  pricingCurrency: string;
  mode: string;
  sessionsIncludedTotal: number;
  packageType: string;
  members: HolisticTeamMember[];
  createdAt: string;
};

export type HolisticTeamListResponse = {
  items: HolisticTeam[];
};

export type CreateHolisticTeamPayload = {
  name?: string;
  scope?: string;
  keywords: string[];
  mode: string;
  packageType?: string;
  pricingAmount?: number;
  pricingCurrency?: string;
  members: Array<{
    professionalId: string;
    role: string;
    sessionsIncluded: number;
  }>;
};
