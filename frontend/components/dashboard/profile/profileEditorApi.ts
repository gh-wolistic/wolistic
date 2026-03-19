import type {
  ProfessionalEditorPayload,
  ProfessionalEditorUpdatePayload,
} from "@/types/professional-editor";

const fallbackApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

const rawApiBase =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  fallbackApiBase;

const API_BASE = rawApiBase.replace(/\/$/, "").endsWith("/api/v1")
  ? rawApiBase.replace(/\/$/, "")
  : `${rawApiBase.replace(/\/$/, "")}/api/v1`;

function toEditorPayload(raw: Record<string, unknown>): ProfessionalEditorPayload {
  return {
    professional_id: raw.professional_id as string,
    username: (raw.username as string) ?? "",
    cover_image_url: (raw.cover_image_url as string) ?? "",
    profile_image_url: (raw.profile_image_url as string) ?? "",
    specialization: (raw.specialization as string) ?? "",
    membership_tier: (raw.membership_tier as string) ?? "",
    experience_years: Number(raw.experience_years ?? 0),
    location: (raw.location as string) ?? "",
    sex: (raw.sex as string) ?? "undisclosed",
    short_bio: (raw.short_bio as string) ?? "",
    about: (raw.about as string) ?? "",
    approaches: ((raw.approaches as Record<string, unknown>[]) ?? []).map((item) => ({
      title: (item.title as string) ?? "",
      description: (item.description as string) ?? "",
    })),
    availability_slots: ((raw.availability_slots as Record<string, unknown>[]) ?? []).map((item) => ({
      day_of_week: Number(item.day_of_week ?? 0),
      start_time: (item.start_time as string) ?? "09:00:00",
      end_time: (item.end_time as string) ?? "17:00:00",
      timezone: (item.timezone as string) ?? "UTC",
    })),
    certifications: ((raw.certifications as Record<string, unknown>[]) ?? []).map((item) => ({
      name: (item.name as string) ?? "",
      issuer: (item.issuer as string) ?? "",
      issued_year:
        typeof item.issued_year === "number"
          ? item.issued_year
          : item.issued_year
            ? Number(item.issued_year)
            : undefined,
    })),
    education: ((raw.education as string[]) ?? []).filter(Boolean),
    expertise_areas: ((raw.expertise_areas as Record<string, unknown>[]) ?? []).map((item) => ({
      title: (item.title as string) ?? "",
      description: (item.description as string) ?? "",
    })),
    gallery: ((raw.gallery as Record<string, unknown>[]) ?? []).map((item) => ({
      image_url: (item.image_url as string) ?? "",
      caption: (item.caption as string) ?? "",
      display_order: Number(item.display_order ?? 0),
    })),
    languages: ((raw.languages as string[]) ?? []).filter(Boolean),
    session_types: ((raw.session_types as string[]) ?? []).filter(Boolean),
    subcategories: ((raw.subcategories as string[]) ?? []).filter(Boolean),
    services: ((raw.services as Record<string, unknown>[]) ?? []).map((item) => ({
      name: (item.name as string) ?? "",
      short_brief: (item.short_brief as string) ?? "",
      price: Number(item.price ?? 0),
      offers: (item.offers as string) ?? "",
      negotiable: Boolean(item.negotiable),
      offer_type: (item.offer_type as string) ?? "none",
      offer_value:
        typeof item.offer_value === "number"
          ? item.offer_value
          : item.offer_value
            ? Number(item.offer_value)
            : undefined,
      offer_label: (item.offer_label as string) ?? "",
      offer_starts_at: (item.offer_starts_at as string) ?? undefined,
      offer_ends_at: (item.offer_ends_at as string) ?? undefined,
      mode: (item.mode as string) ?? "online",
      duration_value: Number(item.duration_value ?? 30),
      duration_unit: (item.duration_unit as string) ?? "mins",
      is_active: item.is_active === undefined ? true : Boolean(item.is_active),
    })),
    booking_question_templates: ((raw.booking_question_templates as Record<string, unknown>[]) ?? []).map(
      (item) => ({
        prompt: (item.prompt as string) ?? "",
        display_order: Number(item.display_order ?? 1),
        is_required: item.is_required === undefined ? true : Boolean(item.is_required),
        is_active: item.is_active === undefined ? true : Boolean(item.is_active),
      }),
    ),
  };
}

function toUpdatePayload(payload: ProfessionalEditorPayload): ProfessionalEditorUpdatePayload {
  return {
    username: payload.username,
    cover_image_url: payload.cover_image_url,
    profile_image_url: payload.profile_image_url,
    specialization: payload.specialization,
    membership_tier: payload.membership_tier,
    experience_years: payload.experience_years,
    location: payload.location,
    sex: payload.sex || "undisclosed",
    short_bio: payload.short_bio,
    about: payload.about,
    approaches: payload.approaches,
    availability_slots: payload.availability_slots.map((slot) => ({
      ...slot,
      start_time: slot.start_time.length === 5 ? `${slot.start_time}:00` : slot.start_time,
      end_time: slot.end_time.length === 5 ? `${slot.end_time}:00` : slot.end_time,
    })),
    certifications: payload.certifications,
    education: payload.education,
    expertise_areas: payload.expertise_areas,
    gallery: payload.gallery,
    languages: payload.languages,
    session_types: payload.session_types,
    subcategories: payload.subcategories,
    services: payload.services,
    booking_question_templates: payload.booking_question_templates,
  };
}

export async function getProfessionalEditorPayload(token: string): Promise<ProfessionalEditorPayload> {
  const response = await fetch(`${API_BASE}/professionals/me/editor`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load profile editor data (${response.status})`);
  }

  return toEditorPayload((await response.json()) as Record<string, unknown>);
}

export async function updateProfessionalEditorPayload(
  token: string,
  payload: ProfessionalEditorPayload,
): Promise<ProfessionalEditorPayload> {
  const response = await fetch(`${API_BASE}/professionals/me/editor`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(toUpdatePayload(payload)),
  });

  if (!response.ok) {
    throw new Error(`Unable to update profile editor data (${response.status})`);
  }

  return toEditorPayload((await response.json()) as Record<string, unknown>);
}
