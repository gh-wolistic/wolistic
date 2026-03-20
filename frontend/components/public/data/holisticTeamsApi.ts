import type {
  CreateHolisticTeamPayload,
  HolisticTeam,
  HolisticTeamListResponse,
} from "@/types/holistic-team";

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
        image: professional.image ? String(professional.image) : undefined,
        rating: Number(professional.rating || 0),
        reviewCount: Number(professional.review_count || 0),
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
      package_type: payload.packageType,
      pricing_amount: payload.pricingAmount,
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
