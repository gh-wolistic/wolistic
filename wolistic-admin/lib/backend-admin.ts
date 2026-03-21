const BACKEND_BASE_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

function getAdminApiKey(): string {
  const key = process.env.BACKEND_ADMIN_API_KEY;
  if (!key) {
    throw new Error("Missing BACKEND_ADMIN_API_KEY environment variable");
  }
  return key;
}

export async function backendAdminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": getAdminApiKey(),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as T | { detail?: string } | null;

  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body ? body.detail : undefined;
    throw new Error(detail || `Backend admin request failed (${response.status})`);
  }

  return body as T;
}
