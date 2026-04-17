// Use environment variable or fallback to localhost:8000
// Note: NEXT_PUBLIC_* variables are available in both server and client code
const rawApiBase = 
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:8000";

// Ensure /api/v1 is appended if not already present
const API_BASE = rawApiBase.replace(/\/$/, "").endsWith("/api/v1")
  ? rawApiBase.replace(/\/$/, "")
  : `${rawApiBase.replace(/\/$/, "")}/api/v1`;

// Debug logging (remove in production)
if (typeof window !== "undefined") {
  console.log("[classesApi] API_BASE initialized:", API_BASE);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClassCategory = "yoga" | "zumba" | "pilates" | "hiit" | "dance" | "other";
export type ClassStatus = "active" | "draft" | "cancelled";
export type EnrollmentStatus = "confirmed" | "cancelled";
export type PaymentStatus = "paid" | "pending";
export type LocationType = "gym" | "studio" | "home" | "online";

export interface WorkLocation {
  id: number;
  name: string;
  address: string | null;
  location_type: LocationType;
  created_at: string;
}

export type SessionStatus = "draft" | "published" | "cancelled";

export interface SessionSchedule {
  id: number;
  session_date: string;
  start_time: string;
  enrolled_count: number;
  status?: SessionStatus; // draft, published, cancelled
  published_at?: string | null;
  cancelled_at?: string | null;
  is_locked?: boolean;
}

export interface GroupClass {
  id: number;
  title: string;
  category: ClassCategory;
  status: ClassStatus;
  duration_minutes: number;
  capacity: number;
  price: number;
  description: string | null;
  work_location_id: number | null;
  work_location_name: string | null;
  display_term: string; // "session" | "class" | "workshop"
  expires_on: string | null; // ISO date string
  expired_action_taken: boolean;
  upcoming_sessions: SessionSchedule[];
  enrolled_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: number;
  group_class_id: number;
  session_date: string;
  start_time: string;
  enrolled_count: number;
  created_at: string;
}

export interface ClassEnrollment {
  id: number;
  class_session_id: number;
  expert_client_id: number | null;
  client_name: string;
  status: EnrollmentStatus;
  payment_status: PaymentStatus;
  class_title: string | null;
  session_date: string | null;
  start_time: string | null;
  work_location_name: string | null;
  created_at: string;
}

// ── Work Locations ────────────────────────────────────────────────────────────

export async function listWorkLocations(token: string): Promise<WorkLocation[]> {
  try {
    const url = `${API_BASE}/partners/me/work-locations`;
    console.log("[listWorkLocations] Fetching from:", url);
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("[listWorkLocations] Response status:", res.status);
    
    if (!res.ok) {
      console.error("[listWorkLocations] Request failed:", res.statusText);
      return [];
    }
    
    return res.json() as Promise<WorkLocation[]>;
  } catch (error) {
    console.error("[listWorkLocations] Fetch failed:", error);
    return [];
  }
}

export async function createWorkLocation(
  token: string,
  payload: { name: string; address?: string; location_type?: string }
): Promise<WorkLocation> {
  const res = await fetch(`${API_BASE}/partners/me/work-locations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create work location");
  return res.json() as Promise<WorkLocation>;
}

export async function deleteWorkLocation(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/work-locations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete work location");
}

// ── Group Classes ─────────────────────────────────────────────────────────────

export async function listClasses(token: string): Promise<GroupClass[]> {
  try {
    const url = `${API_BASE}/partners/me/classes`;
    console.log("[listClasses] Fetching from:", url);
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("[listClasses] Response status:", res.status);
    
    if (!res.ok) {
      console.error("[listClasses] Request failed:", res.statusText);
      return [];
    }
    
    return res.json() as Promise<GroupClass[]>;
  } catch (error) {
    console.error("[listClasses] Fetch failed:", error);
    return [];
  }
}

export interface CreateClassInput {
  title: string;
  category: string;
  status: string;
  duration_minutes: number;
  capacity: number;
  price: number;
  description?: string;
  work_location_id?: number;
}

export async function createClass(token: string, payload: CreateClassInput): Promise<GroupClass> {
  const res = await fetch(`${API_BASE}/partners/me/classes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error: any = new Error("Failed to create class");
    error.response = { status: res.status, data: errorData };
    throw error;
  }
  return res.json() as Promise<GroupClass>;
}

export async function updateClass(
  token: string,
  classId: number,
  payload: Partial<CreateClassInput>
): Promise<GroupClass> {
  const res = await fetch(`${API_BASE}/partners/me/classes/${classId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error: any = new Error("Failed to update class");
    error.response = { status: res.status, data: errorData };
    throw error;
  }
  return res.json() as Promise<GroupClass>;
}

export async function deleteClass(token: string, classId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/classes/${classId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete class");
}

// ── Class Sessions ────────────────────────────────────────────────────────────

export async function createSession(
  token: string,
  classId: number,
  payload: { session_date: string; start_time: string }
): Promise<ClassSession> {
  const res = await fetch(`${API_BASE}/partners/me/classes/${classId}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to schedule session");
  return res.json() as Promise<ClassSession>;
}

export async function bulkCreateSessions(
  token: string,
  classId: number,
  payload: {
    recurrence_type: "single" | "daily" | "weekly";
    start_date: string;
    start_time: string;
    end_date?: string;
    number_of_sessions?: number;
    days_of_week?: number[];
  }
): Promise<{ sessions_created: number; sessions: ClassSession[] }> {
  const res = await fetch(`${API_BASE}/partners/me/classes/${classId}/sessions/bulk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail?.message || "Failed to create sessions");
  }
  return res.json();
}

export async function deleteSession(
  token: string,
  classId: number,
  sessionId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/classes/${classId}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete session");
}

export async function publishSession(
  token: string,
  sessionId: number
): Promise<{ session_id: number; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/partners/me/sessions/${sessionId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to publish session");
  return res.json();
}

export async function cancelSession(
  token: string,
  sessionId: number,
  reason: string
): Promise<{
  session_id: number;
  status: string;
  enrollments_cancelled: number;
  successful_refunds: number;
  total_refunded: number;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/partners/me/sessions/${sessionId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancellation_reason: reason }),
  });
  if (!res.ok) throw new Error("Failed to cancel session");
  return res.json();
}

// TODO: Backend doesn't have a batch attendance endpoint. This calls the individual
// enrollment endpoint multiple times. Consider implementing a batch endpoint for performance.
export async function markAttendance(
  token: string,
  sessionId: number,
  attendance: Array<{ enrollment_id: number; status: string }>
): Promise<{ session_id: number; updated_count: number; refunds_processed: number }> {
  let updated_count = 0;
  let refunds_processed = 0;

  for (const { enrollment_id, status } of attendance) {
    const res = await fetch(`${API_BASE}/partners/me/enrollments/${enrollment_id}/mark-attendance`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attendance_status: status }),
    });
    
    if (res.ok) {
      updated_count++;
      const data = await res.json();
      // If the response indicates a refund was processed (status would be 'refunded' or similar)
      if (data.status === "refunded" || data.status === "session_cancelled") {
        refunds_processed++;
      }
    }
  }

  return { session_id: sessionId, updated_count, refunds_processed };
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export async function listEnrollments(token: string): Promise<ClassEnrollment[]> {
  try {
    const url = `${API_BASE}/partners/me/enrollments`;
    console.log("[listEnrollments] Fetching from:", url);
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log("[listEnrollments] Response status:", res.status);
    
    if (!res.ok) {
      console.error("[listEnrollments] Request failed:", res.statusText);
      return [];
    }
    
    return res.json() as Promise<ClassEnrollment[]>;
  } catch (error) {
    console.error("[listEnrollments] Fetch failed:", error);
    return [];
  }
}

export async function updateEnrollment(
  token: string,
  enrollmentId: number,
  payload: { status?: string; payment_status?: string }
): Promise<ClassEnrollment> {
  const res = await fetch(`${API_BASE}/partners/me/enrollments/${enrollmentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update enrollment");
  return res.json() as Promise<ClassEnrollment>;
}

// ── Tier Limits ───────────────────────────────────────────────────────────────

export interface TierLimits {
  tier: string;
  limits: {
    max_active_classes: number;
    max_sessions_per_month: number;
  };
  usage: {
    active_classes: number;
    sessions_this_month: number;
    current_month: string;
  };
  upgrade_available: boolean;
  next_tier: string | null;
}

export async function getTierLimits(token: string): Promise<TierLimits | null> {
  try {
    const url = `${API_BASE}/partners/me/tier-limits`;
    console.log("[getTierLimits] API_BASE:", API_BASE);
    console.log("[getTierLimits] Full URL:", url);
    console.log("[getTierLimits] Token (first 20 chars):", token?.substring(0, 20));
    
    const res = await fetch(url, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      mode: "cors",
      credentials: "omit",
    });
    
    console.log("[getTierLimits] Response received - status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[getTierLimits] Error response:", errorText);
      return null;
    }
    
    return res.json() as Promise<TierLimits>;
  } catch (error) {
    console.error("[getTierLimits] Fetch exception:", error);
    console.error("[getTierLimits] Error details:", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}
