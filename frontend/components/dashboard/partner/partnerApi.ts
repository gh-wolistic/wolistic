import { getProfessionalEditorPayload } from "@/components/dashboard/profile/profileEditorApi";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

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

export type PartnerActiveClient = {
  client_user_id: string;
  name: string;
  initials: string;
  last_session_at: string | null;
  next_session_at: string | null;
  status: string;
};

export type PartnerFollowUp = {
  id: string;
  client_user_id: string;
  name: string;
  initials: string;
  last_session_at: string | null;
  reason: string;
  due_date: string | null;
  note: string | null;
  is_overdue: boolean;
  is_manual: boolean;
};

export type DashboardCoinTransaction = {
  id: number;
  amount: number;
  balance_after: number;
  event_type: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
};

export type TodaySession = {
  booking_reference: string;
  client_name: string;
  client_initials: string;
  service_name: string;
  scheduled_at: string | null;
  is_immediate: boolean;
  status: string;
};

export type PartnerDashboardAggregate = {
  overview: {
    membership_tier: string | null;
    specialization: string | null;
    location: string | null;
    languages_total: number;
    certifications_total: number;
  };
  metrics: {
    services_total: number;
    active_services_total: number;
    availability_slots_total: number;
    booking_questions_total: number;
    bookings_total: number;
    upcoming_bookings_total: number;
    immediate_bookings_total: number;
    completed_bookings_total: number;
    holistic_teams_total: number;
    revenue_total: number;
    revenue_currency: string | null;
    rating_avg: number;
    rating_count: number;
    upcoming_sessions_total: number;
  };
  recent_reviews: Array<{
    id: number;
    reviewer_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
  active_clients: PartnerActiveClient[];
  follow_ups: PartnerFollowUp[];
  today_sessions: TodaySession[];
};

export type PartnerDashboardData = {
  editor: ProfessionalEditorPayload;
  aggregate: PartnerDashboardAggregate | null;
  recentCoinTransactions: DashboardCoinTransaction[];
};

async function getPartnerDashboardAggregate(token: string): Promise<PartnerDashboardAggregate | null> {
  const response = await fetch(`${API_BASE}/partners/me/dashboard`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PartnerDashboardAggregate;
}

async function getRecentCoinTransactions(token: string): Promise<DashboardCoinTransaction[]> {
  try {
    const response = await fetch(`${API_BASE}/coins/me/transactions?page=1&size=10`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { items: DashboardCoinTransaction[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function getPartnerDashboardData(token: string): Promise<PartnerDashboardData> {
  const [editor, aggregate, recentCoinTransactions] = await Promise.all([
    getProfessionalEditorPayload(token),
    getPartnerDashboardAggregate(token),
    getRecentCoinTransactions(token),
  ]);

  return { editor, aggregate, recentCoinTransactions };
}
