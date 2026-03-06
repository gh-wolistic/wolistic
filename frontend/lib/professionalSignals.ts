import type { ProfessionalProfile } from "@/types/professional";

/** Map membership_tier to a user-friendly label. */
export function inferMembershipLabel(
  professional: ProfessionalProfile,
): string | null {
  switch (professional.membershipTier) {
    case "premium":
      return "Premium Member";
    case "verified":
      return "Verified";
    case "basic":
      return null;
    default:
      return null;
  }
}

/** Whether the professional should show the "online" indicator. */
export function isProfessionalOnline(professional: ProfessionalProfile): boolean {
  return professional.isOnline;
}
