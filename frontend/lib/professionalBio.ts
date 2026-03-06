import type { ProfessionalProfile } from "@/types/professional";

/** Derive a trimmed short bio. */
export function getProfessionalShortBio(
  professional: ProfessionalProfile,
  maxLength = 220,
): string {
  const raw = professional.shortBio || professional.about || "";
  if (raw.length <= maxLength) return raw;
  return raw.slice(0, maxLength).trimEnd() + "…";
}

/** Return the full about text (first paragraph if very long). */
export function getProfessionalAbout(professional: ProfessionalProfile): string {
  return professional.about || professional.shortBio || "";
}
