/**
 * Admin Dashboard Type Definitions
 * 
 * Type-safe interfaces for all admin API endpoints
 * Last Updated: April 15, 2026
 */

// ============================================================================
// Core Types
// ============================================================================

export type UserStatus = "pending" | "verified" | "suspended";
export type AdminProfessionalStatus = UserStatus;
export type MembershipTier = "free" | "pro" | "elite" | "celeb";
export type UserType = "client" | "partner";
export type SubscriptionStatus = "active" | "grace" | "expired" | "cancelled";
export type OfferAssignmentStatus = "pending" | "active" | "redeemed" | "expired" | "revoked";

// ============================================================================
// Professional Management
// ============================================================================

export interface ProfessionalProfile {
  username: string | null;
  specialization: string | null;
  membership_tier: MembershipTier | null;
  profile_completeness: number;
  location: string | null;
  has_profile: boolean;
  is_admin_upgraded: boolean;
}

export interface Professional {
  id: string;
  email: string;
  full_name: string | null;
  user_subtype: string | null;
  user_status: UserStatus;
  created_at: string;
  profile: ProfessionalProfile;
}

export interface ProfessionalListResponse {
  items: Professional[];
  total: number;
}

export interface ProfessionalDetail extends Professional {
  phone: string | null;
  bio: string | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
  }>;
  credentials: Array<{
    id: string;
    type: string;
    document_url: string | null;
    verified: boolean;
  }>;
  total_bookings: number;
  total_clients: number;
  rating: number | null;
  review_count: number;
}

export interface BulkApproveResponse {
  requested: number;
  approved: number;
  min_profile_completeness: number;
  updated_ids?: string[];
}

// ============================================================================
// User Management
// ============================================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  user_status: UserStatus;
  created_at: string;
  last_login: string | null;
}

export interface UserListResponse {
  items: User[];
  total: number;
}

export interface UserDetail extends User {
  phone: string | null;
  booking_count: number;
  coin_balance: number;
  subscription_tier: MembershipTier | null;
  professional_profile: ProfessionalProfile | null;
}

// ============================================================================
// Coin Management
// ============================================================================

export interface CoinWallet {
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  tier_name: string;
  tier_next_name: string | null;
  tier_coins_needed: number | null;
  updated_at: string;
}

export interface CoinTransaction {
  id: number;
  amount: number;
  balance_after: number;
  event_type: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface CoinTransactionPage {
  items: CoinTransaction[];
  total: number;
}

export interface CoinRule {
  event_type: string;
  coins_awarded: number;
  is_active: boolean;
  max_per_user: number | null;
  cooldown_days: number | null;
  description: string | null;
  updated_at: string;
}

export interface CoinRuleCreate {
  event_type: string;
  coins_awarded: number;
  is_active?: boolean;
  max_per_user?: number | null;
  cooldown_days?: number | null;
  description?: string | null;
}

export interface CoinRuleUpdate {
  coins_awarded?: number;
  is_active?: boolean;
  max_per_user?: number | null;
  cooldown_days?: number | null;
  description?: string | null;
}

export interface CoinAdjustResult {
  user_id: string;
  amount: number;
  new_balance: number;
  transaction_id: number;
}

// ============================================================================
// Subscription Management
// ============================================================================

export interface SubscriptionPlan {
  id: number;
  expert_type: string;
  name: string;
  tier: MembershipTier;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignedSubscription {
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

export interface SubscriptionPlanCreate {
  expert_type: string;
  name: string;
  tier: MembershipTier;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  features: string[];
  limits: Record<string, unknown>;
  display_order?: number;
  is_active?: boolean;
}

export interface SubscriptionPlanUpdate {
  name?: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number | null;
  features?: string[];
  limits?: Record<string, unknown>;
  display_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Offer Management
// ============================================================================

export interface OfferUsageSummary {
  assigned: number;
  pending: number;
  active: number;
  redeemed: number;
  expired: number;
  revoked: number;
}

export interface Offer {
  id: number;
  code: string;
  name: string;
  description: string | null;
  offer_type: "tier_upgrade" | "tier_discount" | "service_discount";
  domain: "subscription" | "booking";
  target_tier: MembershipTier | null;
  duration_months: number | null;
  auto_downgrade_after_months: number | null;
  downgrade_to_tier: MembershipTier | null;
  max_redemptions: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage: OfferUsageSummary;
}

export interface OfferCreate {
  code: string;
  name: string;
  description?: string | null;
  offer_type?: "tier_upgrade" | "tier_discount" | "service_discount";
  domain?: "subscription" | "booking";
  target_tier?: MembershipTier | null;
  duration_months?: number | null;
  auto_downgrade_after_months?: number | null;
  downgrade_to_tier?: MembershipTier | null;
  max_redemptions?: number | null;
  valid_from: string;
  valid_until?: string | null;
}

export interface OfferAssignment {
  id: number;
  offer_code: string;
  offer_name: string;
  professional_id: string;
  status: OfferAssignmentStatus;
  assigned_at: string;
  activated_at: string | null;
  expires_at: string | null;
  notes: string | null;
}

export interface OfferAssignmentListResponse {
  total: number;
  limit: number;
  offset: number;
  items: OfferAssignment[];
}

// ============================================================================
// Audit Logging
// ============================================================================

export interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  admin_identifier: string;
  request_method: string;
  request_path: string;
  payload: Record<string, unknown> | null;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
}

export interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  resource_id?: string;
  admin_identifier?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Dashboard Analytics
// ============================================================================

export interface DashboardMetrics {
  total_professionals: number;
  professionals_by_tier: {
    free: number;
    pro: number;
    elite: number;
    celeb: number;
  };
  pending_verifications: number;
  active_subscriptions: number;
  total_coins_circulated: number;
  total_users: number;
  total_bookings: number;
  revenue_total: number;
  revenue_monthly: number;
}

export interface RegistrationTrend {
  date: string;
  count: number;
  type: "client" | "professional";
}

export interface RevenueTrend {
  date: string;
  amount: number;
  tier: MembershipTier;
}

// ============================================================================
// Filter & Pagination Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ProfessionalFilters extends PaginationParams {
  status?: UserStatus | "all";
  tier?: MembershipTier;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface UserFilters extends PaginationParams {
  user_type?: UserType | "all";
  user_status?: UserStatus | "all";
  search?: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiError {
  detail: string;
  status?: number;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

// ============================================================================
// Event Types for Coin Rules
// ============================================================================

export const COIN_EVENT_TYPES = [
  "welcome_bonus",
  "profile_verified",
  "profile_name_set",
  "profile_milestone_50",
  "profile_milestone_75",
  "profile_milestone_100",
  "booking_completed",
  "booking_cashback",
  "first_booking",
  "session_complete",
  "client_onboarding_complete",
  "daily_checkin",
  "review_received",
  "review_given",
  "referral_partner",
  "referral_client",
  "admin_adjustment",
  "redemption",
] as const;

export type CoinEventType = typeof COIN_EVENT_TYPES[number];

// ============================================================================
// Admin Action Types
// ============================================================================

export const ADMIN_ACTIONS = [
  "approve_professional",
  "suspend_professional",
  "update_tier",
  "adjust_coins",
  "create_plan",
  "update_plan",
  "delete_plan",
  "assign_subscription",
  "create_coin_rule",
  "update_coin_rule",
  "delete_coin_rule",
  "delete_user",
] as const;

export type AdminAction = typeof ADMIN_ACTIONS[number];

// ============================================================================
// Resource Types
// ============================================================================

export const RESOURCE_TYPES = [
  "professional",
  "user",
  "coin",
  "coin_rule",
  "subscription",
  "subscription_plan",
  "billing",
  "offer",
  "offer_assignment",
  "offer_maintenance",
] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

// ============================================================================
// Audit Logs
// ============================================================================

export interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  admin_email: string;
  request_method: string;
  request_path: string;
  payload: Record<string, unknown> | null;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogFilters extends PaginationParams {
  admin_email?: string;
  resource_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
}
