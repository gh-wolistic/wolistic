"use client";

import { useEffect, useState } from "react";
import { getCoinRules } from "@/components/dashboard/coins/coinApi";
import type { CoinRule } from "@/types/coins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift } from "lucide-react";

const RULE_DESCRIPTIONS: Record<string, string> = {
  welcome_bonus: "Complete sign-up & onboarding",
  booking_cashback: "Earn coins on every confirmed booking",
  first_booking: "Bonus for your very first booking",
  session_complete: "Partner: earn coins after each session",
  client_onboarding_complete: "Complete your client onboarding",
  profile_name_set: "Add your display name to your profile",
  daily_checkin: "Check in every day to earn coins",
  profile_milestone_50: "Fill your profile to 50%",
  profile_milestone_75: "Fill your profile to 75%",
  profile_milestone_100: "Complete your profile 100%",
  profile_verified: "Get your profile verified by Wolistic",
  review_received: "Partner: each client review earned",
  review_given: "Client: leave a review after a session",
  referral_partner: "Refer a new partner to Wolistic",
  referral_client: "Refer a new client to Wolistic",
};

export function CoinEarnRulesCard() {
  const [rules, setRules] = useState<CoinRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCoinRules()
      .then(setRules)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load rules"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-400" />
          How to Earn Coins
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-400">{error}</p>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.event_type}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <p className="text-sm text-white/70 flex-1 min-w-0 truncate">
                  {rule.description || RULE_DESCRIPTIONS[rule.event_type] || rule.event_type.replace(/_/g, " ")}
                </p>
                <span className="ml-4 text-sm font-semibold text-amber-400 whitespace-nowrap">
                  +{rule.coins_awarded}
                </span>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-sm text-white/40 py-4 text-center">No active earning rules</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
