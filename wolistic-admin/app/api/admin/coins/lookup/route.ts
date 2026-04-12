import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin-auth";
import { backendAdminFetch } from "@/lib/backend-admin";

type UserLookupResult = { user_id: string; email: string };
type CoinWallet = {
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  tier_name: string;
  tier_next_name: string | null;
  tier_coins_needed: number | null;
  updated_at: string;
};
type TransactionPage = {
  items: Array<{
    id: number;
    amount: number;
    balance_after: number;
    event_type: string;
    reference_type: string | null;
    notes: string | null;
    created_at: string;
  }>;
  total: number;
};

export async function GET(request: Request) {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }

  try {
    const user = await backendAdminFetch<UserLookupResult>(
      `/api/v1/admin/users/by-email?email=${encodeURIComponent(email)}`,
    );
    const [wallet, transactions] = await Promise.all([
      backendAdminFetch<CoinWallet>(`/api/v1/coins/admin/wallet/${user.user_id}`),
      backendAdminFetch<TransactionPage>(
        `/api/v1/coins/admin/transactions/${user.user_id}?page=1&size=20`,
      ),
    ]);
    return NextResponse.json({ user_id: user.user_id, wallet, transactions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    const status = message.includes("not found") || message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
