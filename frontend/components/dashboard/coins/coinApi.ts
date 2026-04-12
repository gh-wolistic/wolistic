import type {
  CoinRedemptionRequest,
  CoinRedemptionResult,
  CoinRule,
  CoinTransactionPage,
  CoinWallet,
} from "@/types/coins";

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

async function authFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Coins API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getCoinWallet(token: string): Promise<CoinWallet> {
  return authFetch<CoinWallet>(`${API_BASE}/coins/me/wallet`, token);
}

export async function getCoinTransactions(
  token: string,
  page = 1,
  size = 20,
): Promise<CoinTransactionPage> {
  return authFetch<CoinTransactionPage>(
    `${API_BASE}/coins/me/transactions?page=${page}&size=${size}`,
    token,
  );
}

export async function redeemCoins(
  token: string,
  body: CoinRedemptionRequest,
): Promise<CoinRedemptionResult> {
  return authFetch<CoinRedemptionResult>(`${API_BASE}/coins/me/redeem`, token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getCoinRules(): Promise<CoinRule[]> {
  const response = await fetch(`${API_BASE}/coins/rules`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Coins rules API error ${response.status}`);
  }
  return response.json() as Promise<CoinRule[]>;
}

export async function dailyCheckin(token: string): Promise<CoinWallet> {
  return authFetch<CoinWallet>(`${API_BASE}/coins/me/checkin`, token, {
    method: "POST",
  });
}
