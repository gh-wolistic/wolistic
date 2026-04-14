/**
 * API client for Client Manager (Elite/Pro dashboard)
 * Backend endpoints: /api/v1/partners/me/clients, /api/v1/partners/me/routines
 */

import { Client, Routine, FollowUp, DashboardMetrics, RoutineItem } from '@/types/routines';
import { getSupabaseBrowserClient } from './supabase-browser';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Helper ─────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ── Dashboard Metrics ─────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return apiRequest<DashboardMetrics>('/api/v1/partners/me/clients/metrics');
}

// ── Clients CRUD ──────────────────────────────────────────────────────────

export interface ClientsResponse {
  clients: Client[];
  follow_ups: FollowUp[];
  leads: any[]; // ExpertLead type
}

export async function fetchClientsBoard(): Promise<ClientsResponse> {
  return apiRequest<ClientsResponse>('/api/v1/partners/me/clients-board');
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status?: string;
  package_name?: string;
  acquisition_source?: string;
  goals?: string;
  preferences?: string;
  medical_history?: string;
  dietary_requirements?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
}

export async function createClient(data: CreateClientInput): Promise<Client> {
  return apiRequest<Client>('/api/v1/partners/me/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(clientId: number, updates: Partial<CreateClientInput>): Promise<Client> {
  return apiRequest<Client>(`/api/v1/partners/me/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteClient(clientId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/partners/me/clients/${clientId}`, {
    method: 'DELETE',
  });
}

// ── Routines CRUD ─────────────────────────────────────────────────────────

export interface CreateRoutineInput {
  client_id?: number;
  title: string;
  description: string;
  status?: string;
  source_type?: string;
  is_template?: boolean;
  template_id?: number;
  duration_weeks?: number;
  items?: {
    item_type: string;
    order: number;
    title: string;
    instructions?: string;
    sets?: number;
    reps?: number;
    rest_seconds?: number;
    intensity?: string;
    meal_type?: string;
    calories?: number;
  }[];
}

export async function fetchRoutines(params?: {
  is_template?: boolean;
  client_id?: number;
}): Promise<Routine[]> {
  const query = new URLSearchParams();
  if (params?.is_template !== undefined) {
    query.append('is_template', String(params.is_template));
  }
  if (params?.client_id !== undefined) {
    query.append('client_id', String(params.client_id));
  }
  
  const endpoint = `/api/v1/partners/me/routines${query.toString() ? `?${query.toString()}` : ''}`;
  return apiRequest<Routine[]>(endpoint);
}

export async function fetchRoutine(routineId: number): Promise<Routine> {
  return apiRequest<Routine>(`/api/v1/partners/me/routines/${routineId}`);
}

export async function createRoutine(data: CreateRoutineInput): Promise<Routine> {
  return apiRequest<Routine>('/api/v1/partners/me/routines', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoutine(
  routineId: number,
  updates: {
    title?: string;
    description?: string;
    status?: string;
    current_week?: number;
  }
): Promise<Routine> {
  return apiRequest<Routine>(`/api/v1/partners/me/routines/${routineId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteRoutine(routineId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/partners/me/routines/${routineId}`, {
    method: 'DELETE',
  });
}

export async function assignRoutineToClient(routineId: number, clientId: number): Promise<Routine> {
  return apiRequest<Routine>(`/api/v1/partners/me/routines/${routineId}/assign/${clientId}`, {
    method: 'POST',
  });
}

export async function updateRoutineItem(
  routineId: number,
  itemId: number,
  updates: {
    completed?: boolean;
    order?: number;
    title?: string;
    instructions?: string;
    sets?: number;
    reps?: number;
    rest_seconds?: number;
    intensity?: string;
  }
): Promise<RoutineItem> {
  return apiRequest<RoutineItem>(`/api/v1/partners/me/routines/${routineId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ── Follow-ups CRUD ───────────────────────────────────────────────────────

export interface CreateFollowUpInput {
  client_id: number;
  note: string;
  due_date: string; // ISO datetime
}

export async function createFollowUp(data: CreateFollowUpInput): Promise<FollowUp> {
  return apiRequest<FollowUp>('/api/v1/partners/me/followups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFollowUp(
  followUpId: number,
  updates: {
    note?: string;
    due_date?: string;
    resolved?: boolean;
  }
): Promise<FollowUp> {
  return apiRequest<FollowUp>(`/api/v1/partners/me/followups/${followUpId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteFollowUp(followUpId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/partners/me/followups/${followUpId}`, {
    method: 'DELETE',
  });
}
