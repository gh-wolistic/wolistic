"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  TrendingUp,
  Gift,
  Sparkles,
  Calendar,
  CheckCircle2,
  Star,
  Users,
  Share2,
  Trophy,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCoinWallet } from "@/hooks/use-coin-wallet";
import { getCoinTransactions } from "@/components/dashboard/coins/coinApi";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import type { CoinTransaction } from "@/types/coins";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

const earnOpportunities = [
  {
    id: "earn_1",
    icon: CheckCircle2,
    title: "Complete a Session",
    description: "Earn coins for every session you complete",
    coins: 50,
    color: "emerald",
    frequency: "Per session",
  },
  {
    id: "earn_2",
    icon: Star,
    title: "Receive a Review",
    description: "Get rewarded when clients leave reviews",
    coins: 30,
    color: "amber",
    frequency: "Per review",
  },
  {
    id: "earn_3",
    icon: Users,
    title: "Refer a Partner",
    description: "Refer other professionals to Wolistic",
    coins: 100,
    color: "cyan",
    frequency: "Per referral",
  },
  {
    id: "earn_4",
    icon: Trophy,
    title: "Profile Milestones",
    description: "Complete your profile sections",
    coins: 100,
    color: "purple",
    frequency: "Per milestone",
  },
  {
    id: "earn_5",
    icon: Calendar,
    title: "Weekly Activity Bonus",
    description: "Stay active with regular sessions",
    coins: 75,
    color: "blue",
    frequency: "Weekly",
  },
  {
    id: "earn_6",
    icon: Zap,
    title: "Quick Response",
    description: "Respond to bookings within 2 hours",
    coins: 25,
    color: "orange",
    frequency: "Per booking",
  },
];

const colorClasses: Record<string, string> = {
  emerald: "bg-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/20 text-amber-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
  purple: "bg-purple-500/20 text-purple-400",
  blue: "bg-blue-500/20 text-blue-400",
  orange: "bg-orange-500/20 text-orange-400",
};

const rewardTiers = [
  { name: "Bronze", min: 0, max: 500, color: "from-amber-700 to-amber-900", perk: "Profile badge" },
  {
    name: "Silver",
    min: 500,
    max: 1500,
    color: "from-zinc-400 to-zinc-600",
    perk: "Priority support",
  },
  {
    name: "Gold",
    min: 1500,
    max: 3000,
    color: "from-amber-400 to-amber-600",
    perk: "Featured listing",
  },
  {
    name: "Platinum",
    min: 3000,
    max: 999999,
    color: "from-cyan-400 to-purple-600",
    perk: "Premium perks",
  },
];

const redemptionOptions = [
  {
    id: "redeem_1",
    icon: Gift,
    title: "Profile Boost",
    description: "Featured in search results for 7 days",
    coins: 500,
    available: true,
  },
  {
    id: "redeem_2",
    icon: Sparkles,
    title: "Premium Trial",
    description: "1 month of premium features",
    coins: 1000,
    available: true,
  },
  {
    id: "redeem_3",
    icon: Share2,
    title: "Marketing Kit",
    description: "Professional marketing materials",
    coins: 750,
    available: true,
  },
  {
    id: "redeem_4",
    icon: Trophy,
    title: "Certification Discount",
    description: "20% off next certification course",
    coins: 1500,
    available: false,
  },
];

export function WolisticCoinsPage() {
  const [selectedTab, setSelectedTab] = useState("transactions");
  const { wallet } = useCoinWallet();
  const { accessToken } = useAuthSession();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    getCoinTransactions(accessToken, 1, 20)
      .then((page) => setTransactions(page.items))
      .catch(() => {});
  }, [accessToken]);

  const coinBalance = wallet?.balance ?? 0;
  const totalEarned = wallet?.lifetime_earned ?? 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekEarned = transactions
    .filter((tx) => tx.amount > 0 && new Date(tx.created_at) >= oneWeekAgo)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentTierName = wallet?.tier_name ?? "Bronze";
  const currentTier = rewardTiers.find((t) => t.name === currentTierName) ?? rewardTiers[0];
  const nextTierName = wallet?.tier_next_name;
  const nextTier = nextTierName ? rewardTiers.find((t) => t.name === nextTierName) : null;
  const tierProgress =
    nextTier && nextTier.min > currentTier.min
      ? Math.min(((coinBalance - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)
      : 100;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Hero Card - Coin Balance */}
      <GlassCard className="border-amber-400/30 bg-linear-to-br from-amber-500/20 via-orange-500/15 to-rose-500/10 p-4 sm:p-8 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/30 blur-xl" />
              <div className="relative rounded-full bg-linear-to-br from-amber-400 to-orange-500 p-4 sm:p-6 shadow-lg">
                <Coins className="size-8 sm:size-12 text-white" />
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-zinc-400">Your Balance</p>
              <h1 className="bg-clip-text text-4xl sm:text-6xl font-bold text-transparent bg-linear-to-r from-amber-400 via-orange-400 to-rose-400">
                {coinBalance.toLocaleString()}
              </h1>
              <p className="mt-2 text-lg text-amber-300">Wolistic Coins</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 text-center lg:items-end lg:text-right">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Current Tier</p>
              <Badge
                className={`bg-linear-to-r ${currentTier.color} border-0 px-4 py-1 text-lg text-white`}
              >
                {currentTier.name}
              </Badge>
              <p className="text-xs text-zinc-400">{currentTier.perk}</p>
            </div>
            {nextTier && (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Next tier: {nextTier.name}</span>
                  <span className="text-amber-400">{nextTier.min} pts</span>
                </div>
                <Progress
                  value={tierProgress}
                  className="h-2 bg-white/10 *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-amber-400 *:data-[slot=progress-indicator]:to-orange-400"
                />
                <p className="text-center text-xs text-zinc-500">
                  {nextTier.min - coinBalance} coins to go
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500">Total Earned</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{totalEarned.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="size-3" />
                <span>All time</span>
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/20 p-3">
              <TrendingUp className="size-6 text-emerald-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500">This Week</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{thisWeekEarned.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
                <Calendar className="size-3" />
                <span>Last 7 days</span>
              </div>
            </div>
            <div className="rounded-lg bg-cyan-500/20 p-3">
              <Calendar className="size-6 text-cyan-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500">Available to Redeem</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{coinBalance.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                <Gift className="size-3" />
                <span>Ready to use</span>
              </div>
            </div>
            <div className="rounded-lg bg-amber-500/20 p-3">
              <Gift className="size-6 text-amber-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="border border-white/10 bg-white/5 p-1">
          <TabsTrigger
            value="transactions"
            className="text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="earn"
            className="text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            How to Earn
          </TabsTrigger>
          <TabsTrigger
            value="redeem"
            className="text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Redeem
          </TabsTrigger>
          <TabsTrigger
            value="tiers"
            className="text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            Reward Tiers
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <GlassCard className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Transaction History</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <Info className="size-4 text-zinc-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All your coin earning activities</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Coins className="mb-4 size-12 text-zinc-600" />
                <p className="text-zinc-400">No transactions yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Complete sessions or earn reviews to see activity here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isEarn = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-start gap-4 rounded-lg border border-white/8 bg-white/5 p-4 transition-colors hover:bg-white/8"
                    >
                      <div
                        className={`rounded-lg ${isEarn ? "bg-emerald-500/20" : "bg-rose-500/20"} p-2`}
                      >
                        {isEarn ? (
                          <ArrowUpRight className="size-5 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="size-5 text-rose-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">
                          {tx.notes ?? tx.event_type.replace(/_/g, " ")}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-sm text-zinc-400">
                            {new Date(tx.created_at).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <span className="text-zinc-600">&bull;</span>
                          <Badge className="border-white/10 bg-white/5 text-xs capitalize text-zinc-400">
                            {tx.event_type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${isEarn ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {isEarn ? "+" : ""}
                          {tx.amount}
                        </p>
                        <p className="text-xs text-zinc-500">coins</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* How to Earn Tab */}
        <TabsContent value="earn" className="space-y-4">
          <GlassCard className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Ways to Earn Coins</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {earnOpportunities.map((opportunity) => {
                const Icon = opportunity.icon;
                const cls = colorClasses[opportunity.color] ?? colorClasses.emerald;
                const [bgCls, textCls] = cls.split(" ");

                return (
                  <div
                    key={opportunity.id}
                    className="rounded-lg border border-white/8 bg-white/5 p-4 sm:p-6 transition-all hover:border-white/20 hover:bg-white/8"
                  >
                    <div className={`mb-4 w-fit rounded-lg ${bgCls} p-3`}>
                      <Icon className={`size-6 ${textCls}`} />
                    </div>
                    <h3 className="mb-2 font-semibold text-white">{opportunity.title}</h3>
                    <p className="mb-4 text-sm text-zinc-400">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-amber-400">
                        +{opportunity.coins}
                      </span>
                      <Badge className="border-white/10 bg-white/5 text-xs text-zinc-400">
                        {opportunity.frequency}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Redeem Tab */}
        <TabsContent value="redeem" className="space-y-4">
          <GlassCard className="p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Redeem Your Coins</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {redemptionOptions.map((option) => {
                const Icon = option.icon;
                const canAfford = coinBalance >= option.coins;
                const isAvailable = option.available;

                return (
                  <div
                    key={option.id}
                    className={`rounded-lg border p-4 sm:p-6 transition-all ${
                      canAfford && isAvailable
                        ? "border-amber-400/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 hover:border-amber-400/50"
                        : "border-white/8 bg-white/5"
                    }`}
                  >
                    <div className="mb-4 flex items-start gap-4">
                      <div
                        className={`rounded-lg p-3 ${canAfford && isAvailable ? "bg-amber-500/20" : "bg-white/10"}`}
                      >
                        <Icon
                          className={`size-6 ${canAfford && isAvailable ? "text-amber-400" : "text-zinc-400"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 font-semibold text-white">{option.title}</h3>
                        <p className="text-sm text-zinc-400">{option.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins
                          className={`size-5 ${canAfford && isAvailable ? "text-amber-400" : "text-zinc-500"}`}
                        />
                        <span
                          className={`text-xl font-bold ${canAfford && isAvailable ? "text-amber-400" : "text-zinc-400"}`}
                        >
                          {option.coins}
                        </span>
                      </div>
                      <Button
                        disabled={!canAfford || !isAvailable}
                        className={
                          canAfford && isAvailable
                            ? "bg-linear-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                            : "cursor-not-allowed bg-white/5 text-zinc-500"
                        }
                      >
                        {!isAvailable ? "Coming Soon" : canAfford ? "Redeem" : "Not Enough"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="border-blue-400/30 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-blue-400" />
              <div className="flex-1">
                <p className="font-medium text-blue-400">Redemption Policy</p>
                <p className="text-sm text-blue-300/80">
                  Redeemed coins cannot be refunded. Rewards are activated immediately and sent to
                  your registered email.
                </p>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Reward Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <GlassCard className="p-4 sm:p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">Reward Tier System</h2>
            <div className="space-y-6">
              {rewardTiers.map((tier) => {
                const isCurrentTier = tier.name === currentTierName;
                const isUnlocked = coinBalance >= tier.min;
                const progressInTier =
                  isCurrentTier && nextTier
                    ? ((coinBalance - tier.min) / (nextTier.min - tier.min)) * 100
                    : isUnlocked
                      ? 100
                      : 0;

                return (
                  <div
                    key={tier.name}
                    className={`rounded-lg border p-4 sm:p-6 ${
                      isCurrentTier
                        ? "border-amber-400/40 bg-linear-to-r from-amber-500/20 to-orange-500/10 shadow-lg"
                        : isUnlocked
                          ? "border-white/20 bg-white/8"
                          : "border-white/8 bg-white/5 opacity-60"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-linear-to-br ${tier.color} p-3`}>
                          <Trophy className="size-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                            {isCurrentTier && (
                              <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                                Current
                              </Badge>
                            )}
                            {isUnlocked && !isCurrentTier && (
                              <CheckCircle2 className="size-5 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">
                            {tier.min.toLocaleString()}{" "}
                            {tier.max < 999999
                              ? `- ${tier.max.toLocaleString()}`
                              : "+"}{" "}
                            coins
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">Perk</p>
                        <p className="font-medium text-white">{tier.perk}</p>
                      </div>
                    </div>

                    {isCurrentTier && nextTier && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Progress to {nextTier.name}</span>
                          <span className="text-amber-400">
                            {coinBalance.toLocaleString()} / {nextTier.min.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={progressInTier}
                          className="h-2 bg-white/10 *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-amber-400 *:data-[slot=progress-indicator]:to-orange-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
