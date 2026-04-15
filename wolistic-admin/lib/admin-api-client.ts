/**
 * Admin API Client
 * 
 * Centralized fetch wrapper for all admin backend API calls
 * Handles authentication, error handling, and retry logic
 */

import type {
  Professional,
  ProfessionalListResponse,
  ProfessionalDetail,
  BulkApproveResponse,
  User,
  UserListResponse,
  UserDetail,
  CoinWallet,
  CoinTransaction,
  CoinTransactionPage,
  CoinRule,
  CoinRuleCreate,
  CoinRuleUpdate,
  CoinAdjustResult,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  AssignedSubscription,
  BillingRecord,
  AuditLog,
  AuditLogListResponse,
  AuditLogFilters,
  DashboardMetrics,
  ProfessionalFilters,
  UserFilters,
  Offer,
  OfferCreate,
  OfferAssignment,
  OfferAssignmentListResponse,
  ApiError,
} from "@/types/admin";

// ============================================================================
// Configuration
// ============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_BASE = `${BACKEND_URL}/api/v1`;

// ============================================================================
// HTTP Client
// ============================================================================

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    // Merge headers
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Include cookies for session auth
    };

    try {
      const response = await fetch(url, config);

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          detail: `Request failed with status ${response.status}`,
        }));
        const errorMessage = typeof error.detail === 'string' 
          ? error.detail 
          : JSON.stringify(error.detail) || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle no-content responses
      if (response.status === 204) {
        return null as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error - please check your connection");
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    // Build full URL with query params
    const fullEndpoint = `${API_BASE}${endpoint}`;
    const url = new URL(fullEndpoint);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return this.request<T>(url.toString(), { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const client = new ApiClient();

// ============================================================================
// Professional Management
// ============================================================================

export const professionalApi = {
  list: (filters?: ProfessionalFilters) =>
    client.get<ProfessionalListResponse>("/admin/professionals", filters as Record<string, unknown>),

  getById: (userId: string) =>
    client.get<ProfessionalDetail>(`/admin/professionals/${userId}`),

  approve: (userId: string) =>
    client.post<{ status: string }>(`/admin/professionals/${userId}/approve`),

  suspend: (userId: string) =>
    client.post<{ status: string }>(`/admin/professionals/${userId}/suspend`),

  updateStatus: (userId: string, status: "pending" | "verified" | "suspended") =>
    client.post<{ status: string }>(`/admin/professionals/${userId}/status`, { status }),

  updateTier: (userId: string, tier: string, durationMonths = 1, offerCode: string | null = null) => {
    const params = new URLSearchParams({ tier, duration_months: String(durationMonths) });
    if (offerCode) params.append("offer_code", offerCode);
    return client.post<{ tier: string; duration_months: number; offer_code: string | null }>(
      `/admin/professionals/${userId}/tier?${params.toString()}`
    );
  },

  bulkApprove: (userIds: string[], minProfileCompleteness: number = 90) =>
    client.post<BulkApproveResponse>("/admin/professionals/bulk-approve", {
      user_ids: userIds,
      min_profile_completeness: minProfileCompleteness,
    }),

  search: (query: string) =>
    client.get<ProfessionalListResponse>("/admin/professionals/search", { q: query }),
};

// ============================================================================
// User Management
// ============================================================================

export const userApi = {
  list: (filters?: UserFilters) =>
    client.get<UserListResponse>("/admin/users", filters as Record<string, unknown>),

  getById: (userId: string) =>
    client.get<UserDetail>(`/admin/users/${userId}`),

  delete: (userId: string) =>
    client.delete<{ status: string }>(`/admin/users/${userId}`),
};

// ============================================================================
// Coin Management
// ============================================================================

export const coinApi = {
  lookupWallet: (email: string) =>
    client.get<{ user_id: string; wallet: CoinWallet; transactions: CoinTransactionPage }>(
      "/admin/coins/lookup",
      { email }
    ),

  getWallet: (userId: string) =>
    client.get<CoinWallet>(`/admin/wallet/${userId}`),

  getTransactions: (userId: string, limit: number = 50, offset: number = 0) =>
    client.get<CoinTransactionPage>(`/admin/transactions/${userId}`, { limit, offset }),

  adjust: (userId: string, amount: number, notes?: string) =>
    client.post<CoinAdjustResult>("/admin/adjust", {
      user_id: userId,
      amount,
      notes,
    }),

  // Coin Rules
  listRules: () =>
    client.get<CoinRule[]>("/admin/coins/rules"),

  createRule: (rule: CoinRuleCreate) =>
    client.post<CoinRule>("/admin/coins/rules", rule),

  updateRule: (eventType: string, updates: CoinRuleUpdate) =>
    client.patch<CoinRule>(`/admin/coins/rules/${eventType}`, updates),

  deleteRule: (eventType: string) =>
    client.delete<{ status: string }>(`/admin/coins/rules/${eventType}`),

  // Coin Analytics
  getAnalytics: (days: number = 30) =>
    client.get<{
      total_circulating: number;
      earned_last_30d: number;
      spent_last_30d: number;
      active_wallets: number;
      lifetime_earned: number;
      lifetime_redeemed: number;
    }>("/admin/metrics/coin-analytics", { days }),
};

// ============================================================================
// Offer Management
// ============================================================================

export const offerApi = {
  list: () =>
    client.get<Offer[]>("/admin/offers"),

  create: (payload: OfferCreate) =>
    client.post<Offer>("/admin/offers", payload),

  assign: (payload: { offer_code: string; professional_id: string; auto_activate?: boolean; notes?: string | null }) =>
    client.post<OfferAssignment>("/admin/offers/assign", payload),

  listAssignments: (params?: { status?: string; offer_code?: string; limit?: number; offset?: number }) =>
    client.get<OfferAssignmentListResponse>("/admin/offers/assignments", params as Record<string, unknown>),

  runMaintenance: () =>
    client.post<{ status: string; downgraded: number; notifications_sent: number; grace_notifications: number; expired_assignments: number }>(
      "/admin/offers/maintenance/auto-downgrade"
    ),
};

// ============================================================================
// Subscription Management
// ============================================================================

export const subscriptionApi = {
  // Plans
  listPlans: () =>
    client.get<SubscriptionPlan[]>("/admin/subscription/plans"),

  createPlan: (plan: SubscriptionPlanCreate) =>
    client.post<SubscriptionPlan>("/admin/subscription/plans", plan),

  updatePlan: (planId: number, updates: SubscriptionPlanUpdate) =>
    client.patch<SubscriptionPlan>(`/admin/subscription/plans/${planId}`, updates),

  deletePlan: (planId: number) =>
    client.delete<{ status: string }>(`/admin/subscription/plans/${planId}`),

  // Assigned Subscriptions
  listAssigned: (professionalId?: string) =>
    client.get<AssignedSubscription[]>("/admin/subscription/assigned", 
      professionalId ? { professional_id: professionalId } : undefined),

  assignSubscription: (data: {
    professional_id: string;
    plan_id: number;
    status?: string;
    starts_at?: string;
    ends_at?: string | null;
    auto_renew?: boolean;
  }) =>
    client.post<AssignedSubscription>("/admin/subscription/assigned", data),

  deleteAssigned: (subscriptionId: number) =>
    client.delete<{ status: string }>(`/admin/subscription/assigned/${subscriptionId}`),

  // Billing
  listBilling: (professionalId?: string) =>
    client.get<BillingRecord[]>("/admin/subscription/billing",
      professionalId ? { professional_id: professionalId } : undefined),

  createBillingRecord: (data: {
    professional_id: string;
    plan_id: number;
    amount: number;
    currency?: string;
    method?: string | null;
    invoice_ref?: string | null;
    paid_at?: string;
  }) =>
    client.post<BillingRecord>("/admin/subscription/billing", data),
};

// ============================================================================
// Audit Logging
// ============================================================================

export const auditApi = {
  list: (filters?: AuditLogFilters) =>
    client.get<AuditLogListResponse>("/admin/audit-logs", filters as Record<string, unknown>),

  export: async (filters?: AuditLogFilters): Promise<Blob> => {
    const url = new URL("/admin/audit-logs/export", API_BASE);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  },
};

// ============================================================================
// Dashboard Analytics
// ============================================================================

export const analyticsApi = {
  getOverview: () =>
    client.get<DashboardMetrics>("/admin/metrics/overview"),

  getRegistrationTrend: (days: number = 30) =>
    client.get<Array<{ date: string; count: number; type: string }>>(
      "/admin/metrics/registrations",
      { days }
    ),

  getRevenueTrend: (days: number = 30) =>
    client.get<Array<{ date: string; amount: number; tier: string }>>(
      "/admin/metrics/revenue",
      { days }
    ),

  getCoinAnalytics: (days: number = 30) =>
    client.get<{
      total_circulating: number;
      earned_last_30d: number;
      spent_last_30d: number;
      active_wallets: number;
      lifetime_earned: number;
      lifetime_redeemed: number;
    }>("/admin/metrics/coin-analytics", { days }),
};

// ============================================================================
// Session Management
// ============================================================================

export const sessionApi = {
  check: () =>
    client.get<{ authenticated: boolean; email?: string }>("/admin/session"),

  login: (email: string, password: string) =>
    client.post<{ authenticated: boolean; email: string }>("/admin/login", {
      email,
      password,
    }),

  logout: () =>
    client.post<{ status: string }>("/admin/logout"),
};

// ============================================================================
// Export all APIs
// ============================================================================

export const adminApi = {
  professionals: professionalApi,
  users: userApi,
  coins: coinApi,
  offers: offerApi,
  subscriptions: subscriptionApi,
  audit: auditApi,
  analytics: analyticsApi,
  session: sessionApi,
};

export default adminApi;
