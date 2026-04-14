"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getCoinTransactions } from "@/components/dashboard/coins/coinApi";
import type { CoinTransaction, CoinTransactionPage } from "@/types/coins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  welcome_bonus: "Welcome Bonus",
  booking_cashback: "Booking Cashback",
  first_booking: "First Booking Bonus",
  session_complete: "Session Completed",
  client_onboarding_complete: "Onboarding Complete",
  profile_name_set: "Name Added",
  daily_checkin: "Daily Check-in",
  profile_milestone_50: "Profile 50% Complete",
  profile_milestone_75: "Profile 75% Complete",
  profile_milestone_100: "Profile 100% Complete",
  profile_verified: "Profile Verified",
  review_received: "Review Received",
  review_given: "Review Given",
  referral_partner: "Partner Referral",
  referral_client: "Client Referral",
  admin_adjustment: "Admin Adjustment",
  redemption: "Coins Redeemed",
};

function getEventLabel(event_type: string): string {
  return EVENT_LABELS[event_type] ?? event_type.replace(/_/g, " ");
}

function TransactionRow({ txn }: { txn: CoinTransaction }) {
  const positive = txn.amount > 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate">{getEventLabel(txn.event_type)}</p>
        <p className="text-xs text-white/40">
          {new Date(txn.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="text-right ml-3">
        <span
          className={`text-sm font-semibold ${
            positive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {positive ? "+" : ""}
          {txn.amount.toLocaleString()}
        </span>
        <p className="text-xs text-white/40">bal {txn.balance_after.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function CoinHistoryTable() {
  const { accessToken: token } = useAuthSession();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CoinTransactionPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    (p: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      getCoinTransactions(token, p, 10)
        .then((res) => {
          setData(res);
          setPage(p);
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Failed to load history"),
        )
        .finally(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const totalPages = data ? Math.ceil(data.total / 10) : 0;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
          <History className="h-4 w-4 text-white/50" />
          Transaction History
        </CardTitle>
        {data && (
          <Badge variant="outline" className="text-xs text-white/50 border-white/20">
            {data.total} total
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-400">{error}</p>
        )}

        {!loading && !error && data && (
          <>
            {data.items.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">No transactions yet</p>
            ) : (
              <div>
                {data.items.map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadPage(page - 1)}
                  className="text-white/50 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-white/40">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadPage(page + 1)}
                  className="text-white/50 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
