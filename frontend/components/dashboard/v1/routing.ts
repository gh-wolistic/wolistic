import type { UserSubtype } from "@/components/onboarding/types";
import type { AuthUserType } from "@/components/auth/AuthSessionProvider";

export const DASHBOARD_V1_PATHS = {
  client: "/v1/client",
  profile: {
    edit: "/v1/profile/edit",
    settings: "/v1/profile/settings",
    viewAsPublic: "/v1/profile/view-as-public",
  },
  partner: {
    body_expert: "/v1/partner/body-expert",
    mind_expert: "/v1/partner/mind-expert",
    diet_expert: "/v1/partner/diet-expert",
    mutiple_roles: "/v1/partner/multiple-roles",
    brand: "/v1/partner/brand",
    influencer: "/v1/partner/influencer",
  },
  suspended: "/v1/access/suspended",
} as const;

export function getDashboardV1Path(params: {
  userType: AuthUserType;
  userSubtype: UserSubtype | null;
}): string | null {
  if (params.userType === "client") {
    return DASHBOARD_V1_PATHS.client;
  }

  if (params.userType !== "partner" || !params.userSubtype || params.userSubtype === "client") {
    return null;
  }

  return DASHBOARD_V1_PATHS.partner[params.userSubtype] ?? null;
}
