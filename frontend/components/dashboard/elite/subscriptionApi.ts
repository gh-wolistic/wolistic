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

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubscriptionTier = "free" | "pro" | "elite" | "celeb";
export type SubscriptionStatus = "active" | "grace" | "expired" | "cancelled";
export type ExpertType = "body" | "mind" | "diet" | "all";

export interface SubscriptionPlan {
  id: number;
  expert_type: ExpertType;
  name: string;
  tier: SubscriptionTier;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, number | string | boolean>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalSubscription {
  id: number;
  professional_id: string;
  plan_id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingRecord {
  id: number;
  professional_id: string;
  plan_id: number;
  plan_name: string;
  amount: number;
  currency: string;
  method: string | null;
  invoice_ref: string | null;
  paid_at: string;
  created_at: string;
}

export interface MySubscriptionResponse {
  subscription: ProfessionalSubscription | null;
  billing_history: BillingRecord[];
  available_plans: SubscriptionPlan[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Upgrade flow types ────────────────────────────────────────────────────────

export interface UpgradeOrderResult {
  key_id: string;
  order_id: string;
  amount_subunits: number;
  currency: string;
  plan_id: number;
  plan_name: string;
}

export interface UpgradeVerifyData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: number;
}

export interface UpgradeVerifyResult {
  status: string;
  message: string;
}

export interface PriorityTicketResult {
  id: number;
  plan_id: number;
  status: string;
  created_at: string;
}

// ── Expert endpoints ──────────────────────────────────────────────────────────

export async function getMySubscription(token: string): Promise<MySubscriptionResponse> {
  return apiFetch<MySubscriptionResponse>("/partners/subscription/me", token);
}

export async function createUpgradeOrder(
  token: string,
  planId: number,
): Promise<UpgradeOrderResult> {
  return apiFetch<UpgradeOrderResult>("/partners/subscription/upgrade/order", token, {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function verifyUpgrade(
  token: string,
  data: UpgradeVerifyData,
): Promise<UpgradeVerifyResult> {
  return apiFetch<UpgradeVerifyResult>("/partners/subscription/upgrade/verify", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function raisePriorityTicket(
  token: string,
  data: { plan_id: number; message?: string },
): Promise<PriorityTicketResult> {
  return apiFetch<PriorityTicketResult>("/partners/subscription/priority-ticket", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
