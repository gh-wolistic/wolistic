/**
 * Favourites API — thin wrappers around GET / POST / DELETE /favourites/{id}.
 * All endpoints require a valid Bearer token (logged-in users only).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api/v1";

export async function fetchFavouriteStatus(
  professionalId: string,
  token: string,
): Promise<boolean> {
  const response = await fetch(`${API_BASE}/favourites/${professionalId}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return false;
  const data = (await response.json()) as { is_favourite: boolean };
  return data.is_favourite;
}

export async function addFavourite(professionalId: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/favourites/${professionalId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function removeFavourite(professionalId: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/favourites/${professionalId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
