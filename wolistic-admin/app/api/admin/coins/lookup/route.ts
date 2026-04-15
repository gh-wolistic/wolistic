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
    // Use the new combined lookup endpoint at the correct path
    const result = await backendAdminFetch<{
      user_id: string;
      email: string;
      wallet: CoinWallet;
      transactions: TransactionPage;
    }>(
      `/api/v1/coins/admin/lookup?email=${encodeURIComponent(email)}`,
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    const status = message.includes("not found") || message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
