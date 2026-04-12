import type { DashboardRole } from "@/types/dashboard";

export type UserType = "client" | "partner";

export type UserSubtype =
  | "client"
  | "body_expert"
  | "mind_expert"
  | "diet_expert"
  | "mutiple_roles"
  | "brand"
  | "influencer";

export type OnboardingSelection = {
  userType: UserType;
  userSubtype: UserSubtype;
};

export type PartnerSubtypeOption = {
  value: Exclude<UserSubtype, "client">;
  label: string;
  description: string;
};

export const partnerSubtypeOptions: PartnerSubtypeOption[] = [
  {
    value: "body_expert",
    label: "Body Expert",
    description: "Movement, fitness, yoga, rehab, and physical wellness services.",
  },
  {
    value: "mind_expert",
    label: "Mind Expert",
    description: "Therapists, counsellors, psychologists, mindfulness coaches, and mental wellness practitioners.",
  },
  {
    value: "diet_expert",
    label: "Diet Expert",
    description: "Nutrition, meal planning, dietetics, and food-led wellness guidance.",
  },
  {
    value: "mutiple_roles",
    label: "Multiple Roles",
    description: "You work across more than one expert discipline on Wolistic.",
  },
  {
    value: "brand",
    label: "Brand",
    description: "You represent a wellness brand, product line, or commercial partner.",
  },
  {
    value: "influencer",
    label: "Influencer",
    description: "You publish wellness content and build community through your audience.",
  },
];

export function isOnboardingSelectionComplete(
  userType?: UserType | null,
  userSubtype?: UserSubtype | null,
): boolean {
  return Boolean(userType && userSubtype);
}

export function mapUserProfileToDashboardRole(
  userType?: UserType | null,
  userSubtype?: UserSubtype | null,
): DashboardRole {
  if (userType === "client") {
    return "client";
  }

  if (userSubtype === "brand") {
    return "brand";
  }

  if (userSubtype === "influencer") {
    return "partner";
  }

  if (userType === "partner") {
    return "professional";
  }

  return "client";
}