/**
 * Public API client for fetching verified credentials
 * Used in public professional profiles to display verified education, certificates, and licenses
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VerifiedCredential {
  id: number;
  name: string;
  issuer: string;
  issued_date: string | null;
  verified_at: string | null;
}

export interface VerifiedLicense extends VerifiedCredential {
  license_number: string | null;
  expiry_date: string | null;
  registry_link: string | null;
}

export interface VerifiedCredentialsResponse {
  education: VerifiedCredential[];
  certificates: VerifiedCredential[];
  licenses: VerifiedLicense[];
}

/**
 * Fetch all approved verified credentials for a professional by username
 * Public endpoint - no authentication required
 */
export async function getVerifiedCredentials(
  username: string
): Promise<VerifiedCredentialsResponse> {
  const response = await fetch(
    `${API_BASE}/api/v1/professionals/${username}/verified-credentials`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      // Professional not found or has no verified credentials
      return {
        education: [],
        certificates: [],
        licenses: [],
      };
    }
    throw new Error(`Failed to fetch verified credentials: ${response.statusText}`);
  }

  return response.json();
}
