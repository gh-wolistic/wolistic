import type {
  CreateHolisticTeamPayload,
  HolisticTeam,
  HolisticTeamListResponse,
} from "@/types/holistic-team";

const HOLISTIC_TEAM_LIST_CACHE_KEY = "holistic-teams:list:v1";

const API_BASE =
  `${(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000")
    .replace(/\/$/, "")
    .replace(/\/api\/v1$/, "")}/api/v1`;

function toCamelTeam(raw: Record<string, unknown>): HolisticTeam {
  const members = ((raw.members as Record<string, unknown>[]) || []).map((member) => {
    const professional = (member.professional as Record<string, unknown>) || {};
    return {
      role: String(member.role || "other"),
      sessionsIncluded: Number(member.sessions_included || 1),
      professional: {
        id: String(professional.id || ""),
        username: String(professional.username || ""),
        name: String(professional.name || ""),
        specialization: String(professional.specialization || ""),
        category: professional.category ? String(professional.category) : undefined,
        location: professional.location ? String(professional.location) : undefined,
        image: professional.image ? String(professional.image) : undefined,
        rating: Number(professional.rating || 0),
        reviewCount: Number(professional.review_count || 0),
        experienceYears: Number(professional.experience_years || 0),
        membershipTier: professional.membership_tier ? String(professional.membership_tier) : undefined,
        isOnline: Boolean(professional.is_online),
      },
    };
  });

  return {
    id: String(raw.id || ""),
    name: raw.name ? String(raw.name) : undefined,
    sourceType: String(raw.source_type || "engine_generated"),
    scope: String(raw.scope || "professionals"),
    queryTag: raw.query_tag ? String(raw.query_tag) : undefined,
    keywords: ((raw.keywords as string[]) || []).map(String),
    pricingAmount: Number(raw.pricing_amount || 0),
    pricingCurrency: String(raw.pricing_currency || "INR"),
    mode: String(raw.mode || "online"),
    sessionsIncludedTotal: Number(raw.sessions_included_total || members.length),
    packageType: String(raw.package_type || "consultation_only"),
    members,
    createdAt: String(raw.created_at || ""),
  };
}

function normalizeListInput(input: {
  q?: string;
  scope?: string;
  mode?: string;
  packageType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  return {
    q: input.q?.trim() || "",
    scope: input.scope?.trim() || "professionals",
    mode: input.mode?.trim() || "",
    packageType: input.packageType?.trim() || "",
    minPrice: typeof input.minPrice === "number" ? input.minPrice : null,
    maxPrice: typeof input.maxPrice === "number" ? input.maxPrice : null,
    sort: input.sort?.trim() || "recommended",
  };
}

export function buildHolisticTeamListCacheKey(input: {
  q?: string;
  scope?: string;
  mode?: string;
  packageType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}): string {
  return JSON.stringify(normalizeListInput(input));
}

export function readHolisticTeamListCache(cacheKey: string, maxAgeMs = 3 * 60 * 1000): HolisticTeam[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(HOLISTIC_TEAM_LIST_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      key?: string;
      items?: HolisticTeam[];
      cachedAt?: number;
    };

    if (!parsed || parsed.key !== cacheKey || !Array.isArray(parsed.items) || typeof parsed.cachedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.cachedAt > maxAgeMs) {
      return null;
    }

    return parsed.items;
  } catch {
    return null;
  }
}

export function writeHolisticTeamListCache(cacheKey: string, items: HolisticTeam[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      HOLISTIC_TEAM_LIST_CACHE_KEY,
      JSON.stringify({
        key: cacheKey,
        items,
        cachedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures in private mode/quota cases.
  }
}

export async function listHolisticTeams(input: {
  q?: string;
  scope?: string;
  mode?: string;
  packageType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}): Promise<HolisticTeamListResponse> {
  const params = new URLSearchParams();
  if (input.q?.trim()) params.set("q", input.q.trim());
  if (input.scope?.trim()) params.set("scope", input.scope.trim());
  if (input.mode?.trim()) params.set("mode", input.mode.trim());
  if (input.packageType?.trim()) params.set("package_type", input.packageType.trim());
  if (typeof input.minPrice === "number") params.set("min_price", String(input.minPrice));
  if (typeof input.maxPrice === "number") params.set("max_price", String(input.maxPrice));
  if (input.sort?.trim()) params.set("sort", input.sort.trim());

  const res = await fetch(`${API_BASE}/holistic-teams?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Unable to load holistic teams (${res.status})`);
  }

  const data = (await res.json()) as { items: Record<string, unknown>[] };
  return { items: (data.items || []).map(toCamelTeam) };
}

export async function getHolisticTeam(teamId: string): Promise<HolisticTeam> {
  const res = await fetch(`${API_BASE}/holistic-teams/${encodeURIComponent(teamId)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Unable to load team (${res.status})`);
  }

  return toCamelTeam((await res.json()) as Record<string, unknown>);
}

export async function createHolisticTeam(
  payload: CreateHolisticTeamPayload,
  token: string,
): Promise<HolisticTeam> {
  const res = await fetch(`${API_BASE}/holistic-teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name,
      scope: payload.scope || "professionals",
      keywords: payload.keywords,
      mode: payload.mode,
      package_type: payload.packageType || "consultation_only",
      pricing_amount: payload.pricingAmount ?? 0,
      pricing_currency: payload.pricingCurrency || "INR",
      members: payload.members.map((member) => ({
        professional_id: member.professionalId,
        role: member.role,
        sessions_included: member.sessionsIncluded,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Unable to create team (${res.status})`);
  }

  return toCamelTeam((await res.json()) as Record<string, unknown>);
}
