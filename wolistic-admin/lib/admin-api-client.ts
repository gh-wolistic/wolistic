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
  VerificationQueueResponse,
  VerificationFilters,
  IdentityVerification,
  CredentialVerification,
  ApproveVerificationRequest,
  RejectVerificationRequest,
  ApiError,
} from "@/types/admin";

// ============================================================================
// Configuration
// ============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_BASE = `${BACKEND_URL}/api/v1`;
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "MochaMaple@26"; // Fallback for client-side

// ============================================================================
// HTTP Client
// ============================================================================

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    // Debug: Log the URL being fetched in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Request]', { url, method: options.method || 'GET' });
    }

    // Merge headers
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    
    // Add admin API key for all requests
    if (ADMIN_API_KEY) {
      headers.set("X-Admin-Key", ADMIN_API_KEY);
    }

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
      // Check if it's a TypeError from fetch (network error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('[API Error] Network failure', {
          url,
          method: options.method || 'GET',
          backendUrl: BACKEND_URL,
        });
        throw new Error(
          `Network error: Cannot connect to backend at ${BACKEND_URL}. ` +
          `Please ensure the backend is running and accessible.`
        );
      }

      // Only log non-authentication errors in detail
      const isAuthError = error instanceof Error && 
        (error.message.includes('authenticated') || error.message.includes('login'));
      
      if (!isAuthError && process.env.NODE_ENV === 'development') {
        console.error('[API Error]', {
          url,
          method: options.method || 'GET',
          errorType: error?.constructor?.name || typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          backendUrl: BACKEND_URL,
        });
      }

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
    client.get<{ user_id: string; email: string; wallet: CoinWallet; transactions: CoinTransactionPage }>(
      "/coins/admin/lookup",
      { email }
    ),

  getWallet: (userId: string) =>
    client.get<CoinWallet>(`/coins/admin/wallet/${userId}`),

  getTransactions: (userId: string, limit: number = 50, offset: number = 0) =>
    client.get<CoinTransactionPage>(`/coins/admin/transactions/${userId}`, { limit, offset }),

  adjust: (userId: string, amount: number, notes?: string) =>
    client.post<CoinAdjustResult>("/coins/admin/adjust", {
      user_id: userId,
      amount,
      notes,
    }),

  // Coin Rules
  listRules: () =>
    client.get<CoinRule[]>("/coins/rules"),

  createRule: (rule: CoinRuleCreate) =>
    client.post<CoinRule>("/coins/admin/rules", rule),

  updateRule: (eventType: string, updates: CoinRuleUpdate) =>
    client.patch<CoinRule>(`/coins/admin/rules/${eventType}`, updates),

  deleteRule: (eventType: string) =>
    client.delete<{ status: string }>(`/coins/admin/rules/${eventType}`),

  // Coin Analytics
  getAnalytics: (days: number = 30) =>
    client.get<{
      total_circulating: number;
      active_wallets: number;
      total_earned_30d: number;
      total_spent_30d: number;
      earned_change_percent: number;
      spent_change_percent: number;
    }>("/admin/coins/analytics", { days }),
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
// Session Management (Next.js API Routes, not backend)
// ============================================================================

export const sessionApi = {
  check: async () => {
    const response = await fetch("/api/admin/session", { credentials: "include" });
    if (!response.ok) throw new Error("Session check failed");
    return response.json() as Promise<{ authenticated: boolean; email?: string }>;
  },

  login: async (email: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }
    return response.json() as Promise<{ authenticated: boolean; email: string }>;
  },

  logout: async () => {
    const response = await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Logout failed");
    return response.json() as Promise<{ status: string }>;
  },
};

// ============================================================================
// Verification Management
// ============================================================================

export const verificationApi = {
  getQueue: (filters?: VerificationFilters) =>
    client.get<VerificationQueueResponse>("/admin/verification/queue", filters as Record<string, unknown>),

  getDocumentUrl: (documentPath: string, bucketType: "identity" | "credential") =>
    client.get<{ signed_url: string }>("/admin/verification/document-url", { 
      document_path: documentPath, 
      bucket_type: bucketType 
    }),

  approveIdentity: (userId: string, data?: ApproveVerificationRequest) =>
    client.post<IdentityVerification>(`/admin/verification/identity/${userId}/approve`, data || {}),

  rejectIdentity: (userId: string, data: RejectVerificationRequest) =>
    client.post<IdentityVerification>(`/admin/verification/identity/${userId}/reject`, data),

  approveCredential: (credentialId: number, data?: ApproveVerificationRequest) =>
    client.post<CredentialVerification>(`/admin/verification/credential/${credentialId}/approve`, data || {}),

  rejectCredential: (credentialId: number, data: RejectVerificationRequest) =>
    client.post<CredentialVerification>(`/admin/verification/credential/${credentialId}/reject`, data),
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
  verifications: verificationApi,
  session: sessionApi,
};

export default adminApi;
