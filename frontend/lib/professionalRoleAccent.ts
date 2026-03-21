import type { ProfessionalProfile } from "@/types/professional";

export type ProfessionalRole = "body" | "mind" | "diet" | "other";

type RoleAccent = {
  label: string;
  cardClass: string;
  badgeClass: string;
};

const ROLE_ACCENTS: Record<ProfessionalRole, RoleAccent> = {
  body: {
    label: "Body",
    cardClass: "border-amber-300/70 hover:border-amber-400/80 dark:border-amber-500/40 dark:hover:border-amber-400/70",
    badgeClass: "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200",
  },
  mind: {
    label: "Mind",
    cardClass: "border-sky-300/70 hover:border-sky-400/80 dark:border-sky-500/40 dark:hover:border-sky-400/70",
    badgeClass: "border-sky-300/70 bg-sky-50 text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-200",
  },
  diet: {
    label: "Diet",
    cardClass: "border-emerald-300/70 hover:border-emerald-400/80 dark:border-emerald-500/40 dark:hover:border-emerald-400/70",
    badgeClass: "border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  other: {
    label: "General",
    cardClass: "border-slate-300/80 hover:border-slate-400/90 dark:border-slate-700/80 dark:hover:border-slate-500/90",
    badgeClass: "border-slate-300/70 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-200",
  },
};

function inferRoleFromText(value: string): ProfessionalRole {
  const text = value.toLowerCase();

  if (/(mind|mental|psych|therapy|counsel|coach|stress|anxiety)/.test(text)) {
    return "mind";
  }
  if (/(diet|nutrition|meal|gut|food|metabolic)/.test(text)) {
    return "diet";
  }
  if (/(body|fitness|strength|mobility|yoga|physio|rehab|training)/.test(text)) {
    return "body";
  }
  return "other";
}

export function getRoleAccentByRole(role: string | undefined): RoleAccent {
  const normalized = (role || "").trim().toLowerCase() as ProfessionalRole;
  return ROLE_ACCENTS[normalized] ?? ROLE_ACCENTS.other;
}

export function getRoleAccentFromProfessional(profile: ProfessionalProfile): RoleAccent {
  const text = [
    profile.category || "",
    profile.specialization || "",
    ...(profile.subcategories || []),
    ...(profile.specializations || []),
  ].join(" ");
  const role = inferRoleFromText(text);
  return ROLE_ACCENTS[role];
}
