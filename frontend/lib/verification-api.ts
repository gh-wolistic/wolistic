/**
 * API client for Professional Verification System
 * Backend endpoints: /api/v1/professionals/me/verification/*
 */

import { getSupabaseBrowserClient } from './supabase-browser';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────────────────────

export type DocumentType = 'aadhaar' | 'passport' | 'drivers_license' | 'pan_card';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_verified';
export type CredentialType = 'education' | 'certificate' | 'license';

export interface UploadUrlRequest {
  file_name: string;
  file_size: number;
  document_type?: DocumentType;
}

export interface UploadUrlResponse {
  upload_url: string;
  file_path: string;
  expires_at: string;
}

export interface IdentityVerification {
  user_id: string;
  document_type: DocumentType;
  document_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
  grace_period_expires_at: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface CredentialVerification {
  id: number;
  professional_id: string;
  credential_type: CredentialType;
  credential_name: string;
  issuing_organization: string;
  issued_date: string | null;
  expiry_date: string | null;
  license_number: string | null;
  registry_link: string | null;
  document_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface VerificationStatusResponse {
  identity_verification: IdentityVerification | null;
  credentials: CredentialVerification[];
  is_searchable: boolean;
  search_hide_reason: string | null;
}

export interface SubmitIdentityRequest {
  document_type: DocumentType;
  document_url: string;
}

export interface SubmitCredentialRequest {
  credential_type: CredentialType;
  credential_name: string;
  issuing_organization: string;
  issued_date?: string;
  expiry_date?: string;
  license_number?: string;
  registry_link?: string;
  document_url?: string;
}

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

// ── Verification Status ────────────────────────────────────────────────────

export async function getVerificationStatus(): Promise<VerificationStatusResponse> {
  return apiRequest<VerificationStatusResponse>('/api/v1/professionals/me/verification/status');
}

// ── Identity Verification ──────────────────────────────────────────────────

export async function getIdentityVerification(): Promise<IdentityVerification | null> {
  try {
    return await apiRequest<IdentityVerification>('/api/v1/professionals/me/verification/identity');
  } catch (error) {
    // 404 means no identity verification yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function generateIdentityUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>('/api/v1/professionals/me/verification/upload-url', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function submitIdentityVerification(request: SubmitIdentityRequest): Promise<IdentityVerification> {
  return apiRequest<IdentityVerification>('/api/v1/professionals/me/verification/identity', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ── Credential Verification ────────────────────────────────────────────────

export async function getCredentials(): Promise<CredentialVerification[]> {
  return apiRequest<CredentialVerification[]>('/api/v1/professionals/me/verification/credentials');
}

export async function submitCredential(request: SubmitCredentialRequest): Promise<CredentialVerification> {
  return apiRequest<CredentialVerification>('/api/v1/professionals/me/verification/credentials', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function deleteCredential(credentialId: number): Promise<void> {
  return apiRequest<void>(`/api/v1/professionals/me/verification/credentials/${credentialId}`, {
    method: 'DELETE',
  });
}

// ── Direct Supabase Upload ─────────────────────────────────────────────────

export async function uploadDocumentToSupabase(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}
