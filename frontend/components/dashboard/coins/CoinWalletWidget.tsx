"use client";

import { Coins, TrendingUp } from "lucide-react";
import { useCoinWallet } from "@/hooks/use-coin-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TIER_COLORS: Record<string, string> = {
  Bronze: "bg-amber-700/20 text-amber-600 border-amber-700/30",
  Silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  Gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Platinum: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

export function CoinWalletWidget() {
  const { wallet, loading, error } = useCoinWallet();

  if (loading) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !wallet) {
    return null;
  }

  const tierClass = TIER_COLORS[wallet.tier_name] ?? TIER_COLORS.Bronze;
  const progressPct =
    wallet.tier_next_name && wallet.tier_coins_needed
      ? Math.max(
          0,
          Math.min(
            100,
            100 - Math.round((wallet.tier_coins_needed / (wallet.lifetime_earned || 1)) * 100),
          ),
        )
      : 100;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-400" />
          Coin Wallet
        </CardTitle>
        <Badge variant="outline" className={`text-xs ${tierClass}`}>
          {wallet.tier_name}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold text-white">
          {wallet.balance.toLocaleString()}
          <span className="text-sm font-normal text-white/50 ml-1">coins</span>
        </div>

        {wallet.tier_next_name && wallet.tier_coins_needed !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/50">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> To {wallet.tier_next_name}
              </span>
              <span>{wallet.tier_coins_needed.toLocaleString()} more</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs text-white/50">
          <div>
            <div className="text-white/70 font-medium">{wallet.lifetime_earned.toLocaleString()}</div>
            <div>Total earned</div>
          </div>
          <div>
            <div className="text-white/70 font-medium">{wallet.lifetime_redeemed.toLocaleString()}</div>
            <div>Total redeemed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
