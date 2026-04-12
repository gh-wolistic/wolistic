"use client";

import { useState } from "react";

type AdjustResult = {
  user_id: string;
  amount: number;
  new_balance: number;
  transaction_id: number;
};

type WalletInfo = {
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  tier_name: string;
  tier_next_name: string | null;
  tier_coins_needed: number | null;
  updated_at: string;
};

type TransactionItem = {
  id: number;
  amount: number;
  balance_after: number;
  event_type: string;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
};

type TransactionPage = {
  items: TransactionItem[];
  total: number;
};

const EVENT_LABELS: Record<string, string> = {
  welcome_bonus: "Welcome Bonus",
  booking_cashback: "Booking Cashback",
  first_booking: "First Booking Bonus",
  session_complete: "Session Completed",
  client_onboarding_complete: "Onboarding Complete",
  profile_name_set: "Name Added",
  daily_checkin: "Daily Check-in",
  profile_milestone_50: "Profile 50%",
  profile_milestone_75: "Profile 75%",
  profile_milestone_100: "Profile 100%",
  profile_verified: "Profile Verified",
  review_received: "Review Received",
  review_given: "Review Given",
  referral_partner: "Partner Referral",
  referral_client: "Client Referral",
  admin_adjustment: "Admin Adjustment",
  redemption: "Redeemed",
};

function label(event_type: string) {
  return EVENT_LABELS[event_type] ?? event_type.replace(/_/g, " ");
}

export function CoinAdminPanel() {
  const [emailInput, setEmailInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionPage | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState<AdjustResult | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  async function lookupUser() {
    if (!emailInput.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setWallet(null);
    setTransactions(null);
    setUserId(null);
    setAdjustResult(null);

    try {
      // Resolve user ID via admin API route
      const res = await fetch(
        `/api/admin/coins/lookup?email=${encodeURIComponent(emailInput.trim())}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Lookup failed (${res.status})`);
      }
      const data = (await res.json()) as {
        user_id: string;
        wallet: WalletInfo;
        transactions: TransactionPage;
      };
      setUserId(data.user_id);
      setWallet(data.wallet);
      setTransactions(data.transactions);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLookupLoading(false);
    }
  }

  async function submitAdjustment() {
    if (!userId) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      setAdjustError("Enter a non-zero integer amount");
      return;
    }
    if (!adjustNotes.trim()) {
      setAdjustError("Notes are required for admin adjustments");
      return;
    }

    setAdjustLoading(true);
    setAdjustError(null);
    setAdjustResult(null);

    try {
      const res = await fetch("/api/admin/coins/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, amount, notes: adjustNotes.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Adjustment failed (${res.status})`);
      }
      const result = (await res.json()) as AdjustResult;
      setAdjustResult(result);
      setAdjustAmount("");
      setAdjustNotes("");
      // Refresh wallet
      await lookupUser();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdjustLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* User lookup */}
      <div className="rounded border p-4 space-y-3">
        <h2 className="font-semibold text-sm">Look Up User Wallet</h2>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="user@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { void lookupUser(); } }}
            className="flex-1 border rounded px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => { void lookupUser(); }}
            disabled={lookupLoading}
            className="px-4 py-1.5 text-sm rounded bg-gray-900 text-white disabled:opacity-50"
          >
            {lookupLoading ? "Looking up…" : "Lookup"}
          </button>
        </div>
        {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
      </div>

      {/* Wallet summary */}
      {wallet && userId && (
        <div className="rounded border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Wallet — {emailInput}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-medium">
              {wallet.tier_name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{wallet.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{wallet.lifetime_earned.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Lifetime Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{wallet.lifetime_redeemed.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Lifetime Redeemed</div>
            </div>
          </div>

          {/* Admin adjustment */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-medium">Admin Adjustment</h3>
            <div className="flex gap-2 items-start">
              <input
                type="number"
                placeholder="Amount (±)"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-32 border rounded px-3 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="Notes (required)"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => { void submitAdjustment(); }}
                disabled={adjustLoading}
                className="px-4 py-1.5 text-sm rounded bg-indigo-600 text-white disabled:opacity-50"
              >
                {adjustLoading ? "Applying…" : "Apply"}
              </button>
            </div>
            {adjustError && <p className="text-sm text-red-600">{adjustError}</p>}
            {adjustResult && (
              <p className="text-sm text-green-700">
                Applied {adjustResult.amount > 0 ? "+" : ""}
                {adjustResult.amount} coins. New balance: {adjustResult.new_balance.toLocaleString()}.
              </p>
            )}
          </div>

          {/* Transaction history */}
          {transactions && (
            <div className="border-t pt-4 space-y-2">
              <h3 className="text-sm font-medium">
                Recent Transactions ({transactions.total} total)
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-1 pr-3">Event</th>
                    <th className="pb-1 pr-3">Amount</th>
                    <th className="pb-1 pr-3">Balance After</th>
                    <th className="pb-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.items.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-medium">{label(txn.event_type)}</td>
                      <td
                        className={`py-1.5 pr-3 font-semibold ${
                          txn.amount > 0 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {txn.amount > 0 ? "+" : ""}
                        {txn.amount}
                      </td>
                      <td className="py-1.5 pr-3">{txn.balance_after.toLocaleString()}</td>
                      <td className="py-1.5 text-gray-500">
                        {new Date(txn.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
