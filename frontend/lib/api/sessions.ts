/**
 * Public Sessions API Client
 * 
 * Handles all client-facing session operations:
 * - Session discovery and details
 * - Enrollment and waitlist
 * - Professional session listings
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface WorkLocation {
  name: string;
  address?: string;
  location_type: "gym" | "studio" | "home" | "online";
}

export interface SessionDetails {
  id: number;
  class_id: number;
  title: string;
  category: "mind" | "body" | "nutrition" | "lifestyle";
  display_term: "session" | "class";
  session_date: string;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  enrolled_count: number;
  is_sold_out: boolean;
  price: number;
  description?: string;
  work_location?: WorkLocation;
  professional?: {
    username: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export interface EnrollmentResponse {
  enrollment_id: number;
  status: string;
  session_details: {
    id: number;
    title: string;
    session_date: string;
    start_time: string;
    duration_minutes: number;
  };
  payment_confirmation: {
    amount_paid: number;
    payment_status: string;
  };
  message: string;
}

export interface WaitlistResponse {
  interested: true;
  session_id: number;
  message: string;
}

export interface ProfessionalSession {
  id: number;
  title: string;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  enrolled_count: number;
  is_sold_out: boolean;
  price: number;
  category: string;
  display_term: string;
  work_location?: WorkLocation;
}

export interface UserEnrollment {
  id: number;
  class_session_id: number;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  title: string;
  category: string;
  professional_username: string;
  professional_name: string;
  status: "confirmed" | "cancelled" | "attended" | "no_show_client" | "session_cancelled";
  payment_status: "paid" | "pending" | "refunded";
  amount_paid: number;
  enrolled_at: string;
  work_location?: WorkLocation;
}

// ──────────────────────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get details for a specific session (public endpoint)
 */
export async function getSessionDetails(sessionId: number): Promise<SessionDetails> {
  const response = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch session" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Enroll in a session (requires authentication)
 */
export async function enrollInSession(
  sessionId: number,
  token: string,
  paymentOrderId: string
): Promise<EnrollmentResponse> {
  const response = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/enroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      payment_order_id: paymentOrderId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Enrollment failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Register interest/waitlist for sold-out session (requires authentication)
 */
export async function registerInterest(
  sessionId: number,
  token: string
): Promise<WaitlistResponse> {
  const response = await fetch(`${API_BASE}/api/v1/sessions/${sessionId}/interest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to register interest" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get all published sessions for a professional (public endpoint)
 */
export async function getProfessionalSessions(username: string): Promise<ProfessionalSession[]> {
  const response = await fetch(`${API_BASE}/api/v1/professionals/${username}/sessions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch sessions" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.sessions || [];
}

/**
 * Get all available published sessions (public endpoint)
 * Note: This endpoint may need to be added to backend if not exists
 */
export async function getAllPublishedSessions(): Promise<ProfessionalSession[]> {
  const response = await fetch(`${API_BASE}/api/v1/sessions/published`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Return empty array if endpoint doesn't exist yet
    return [];
  }

  const data = await response.json();
  return data.sessions || [];
}

/**
 * Get current user's enrollments (requires authentication)
 * Note: This endpoint may need to be added to backend
 */
export async function getMyEnrollments(token: string): Promise<UserEnrollment[]> {
  const response = await fetch(`${API_BASE}/api/v1/enrollments/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Return empty array if endpoint doesn't exist yet
    if (response.status === 404) {
      return [];
    }
    const error = await response.json().catch(() => ({ detail: "Failed to fetch enrollments" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.enrollments || [];
}
