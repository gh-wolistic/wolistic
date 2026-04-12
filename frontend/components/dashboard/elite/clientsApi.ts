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

export type ClientStatus = "active" | "inactive" | "blocked";
export type LeadStatus = "new" | "contacted" | "converted" | "dropped";
export type LeadSource = "platform" | "referral" | "direct";

export interface ClientRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  status: ClientStatus;
  package_name: string | null;
  last_session_date: string | null;
  next_session_date: string | null;
  created_at: string;
}

export interface FollowUpRecord {
  id: number;
  client_id: number;
  client_name: string;
  client_initials: string;
  last_session_date: string | null;
  note: string;
  due_date: string;
  resolved: boolean;
  created_at: string;
}

export interface LeadRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  source: LeadSource;
  interest: string | null;
  status: LeadStatus;
  enquiry_date: string;
  created_at: string;
}

export interface ClientsBoardData {
  clients: ClientRecord[];
  follow_ups: FollowUpRecord[];
  leads: LeadRecord[];
}

// ── Board ─────────────────────────────────────────────────────────────────────

export async function getClientsBoard(token: string): Promise<ClientsBoardData> {
  const res = await fetch(`${API_BASE}/partners/me/clients-board`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { clients: [], follow_ups: [], leads: [] };
  return res.json() as Promise<ClientsBoardData>;
}

// ── Clients ───────────────────────────────────────────────────────────────────

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status?: ClientStatus;
  package_name?: string | null;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string | null;
  notes?: string | null;
  status?: ClientStatus;
  package_name?: string | null;
}

export async function createClient(token: string, data: CreateClientInput): Promise<ClientRecord> {
  const res = await fetch(`${API_BASE}/partners/me/clients`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create client");
  return res.json() as Promise<ClientRecord>;
}

export async function updateClient(token: string, id: number, data: UpdateClientInput): Promise<ClientRecord> {
  const res = await fetch(`${API_BASE}/partners/me/clients/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update client");
  return res.json() as Promise<ClientRecord>;
}

export async function deleteClient(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/clients/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete client");
}

// ── Follow-ups ────────────────────────────────────────────────────────────────

export interface CreateFollowUpInput {
  client_id: number;
  note: string;
  due_date: string;
}

export interface UpdateFollowUpInput {
  note?: string;
  due_date?: string;
  resolved?: boolean;
}

export async function createFollowUp(token: string, data: CreateFollowUpInput): Promise<FollowUpRecord> {
  const res = await fetch(`${API_BASE}/partners/me/followups`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create follow-up");
  return res.json() as Promise<FollowUpRecord>;
}

export async function updateFollowUp(token: string, id: number, data: UpdateFollowUpInput): Promise<FollowUpRecord> {
  const res = await fetch(`${API_BASE}/partners/me/followups/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update follow-up");
  return res.json() as Promise<FollowUpRecord>;
}

export async function deleteFollowUp(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/followups/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete follow-up");
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  source?: LeadSource;
  interest?: string;
  status?: LeadStatus;
  enquiry_date?: string;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string | null;
  source?: LeadSource;
  interest?: string | null;
  status?: LeadStatus;
}

export async function createLead(token: string, data: CreateLeadInput): Promise<LeadRecord> {
  const res = await fetch(`${API_BASE}/partners/me/leads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  return res.json() as Promise<LeadRecord>;
}

export async function updateLead(token: string, id: number, data: UpdateLeadInput): Promise<LeadRecord> {
  const res = await fetch(`${API_BASE}/partners/me/leads/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json() as Promise<LeadRecord>;
}

export async function deleteLead(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/me/leads/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete lead");
}

export async function convertLeadToClient(token: string, id: number): Promise<ClientRecord> {
  const res = await fetch(`${API_BASE}/partners/me/leads/${id}/convert`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to convert lead");
  return res.json() as Promise<ClientRecord>;
}
