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

export interface SessionSchedule {
  id: number;
  session_date: string;
  start_time: string;
  enrolled_count: number;
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
  const res = await fetch(`${API_BASE}/partners/me/work-locations`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<WorkLocation[]>;
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
  const res = await fetch(`${API_BASE}/partners/me/classes`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<GroupClass[]>;
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
  if (!res.ok) throw new Error("Failed to create class");
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
  if (!res.ok) throw new Error("Failed to update class");
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

// ── Enrollments ───────────────────────────────────────────────────────────────

export async function listEnrollments(token: string): Promise<ClassEnrollment[]> {
  const res = await fetch(`${API_BASE}/partners/me/enrollments`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<ClassEnrollment[]>;
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
