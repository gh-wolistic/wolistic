"use client";

import {
  Star,
  BookOpen,
  MessageSquare,
  Crown,
  AlertCircle,
  Coins,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PartnerDashboardAggregate } from "@/components/dashboard/partner/partnerApi";
import type { CoinWallet } from "@/types/coins";

interface EliteProfilePanelProps {
  displayName: string;
  username: string;
  specialization: string | null;
  location: string | null;
  membershipTier: string | null;
  metrics: PartnerDashboardAggregate["metrics"];
  profileCompleteness: number;
  wallet: CoinWallet | null;
  coverImageUrl?: string | null;
  profileImageUrl?: string | null;
}

function MembershipBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;

  const config: Record<string, { color: string; label: string; icon?: boolean }> = {
    basic: { color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", label: "Basic" },
    verified: {
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      label: "Verified",
    },
    premium: {
      color: "bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-400/30",
      label: "Premium",
      icon: true,
    },
  };

  const badge = config[tier] ?? config.basic;

  return (
    <Badge className={`${badge.color} border px-2 py-0.5 text-xs`}>
      {badge.icon && <Crown className="mr-1 size-3" />}
      {badge.label}
    </Badge>
  );
}

export function EliteProfilePanel({
  displayName,
  username,
  specialization,
  location,
  membershipTier,
  metrics,
  profileCompleteness,
  wallet,
  coverImageUrl,
  profileImageUrl,
}: EliteProfilePanelProps) {
  const coinBalance = wallet?.balance ?? 0;
  const showUpgradeCard = membershipTier !== "premium";
  const avatarInitials = (username || displayName).slice(0, 2).toUpperCase();

  return (
    <aside className="fixed right-0 top-16 hidden h-[calc(100vh-4rem)] w-72 overflow-y-auto border-l border-white/8 bg-[#0d1526]/70 backdrop-blur-2xl xl:block">
      <div className="space-y-4 p-4">
        {/* Cover & Avatar */}
        <div className="relative -mx-4 -mt-4">
          <div className="relative h-20 bg-linear-to-br from-emerald-500/30 via-cyan-500/20 to-sky-500/10">
            {coverImageUrl && (
              <Image
                src={coverImageUrl}
                alt="Cover"
                fill
                className="object-cover"
                sizes="288px"
              />
            )}
          </div>
          <Avatar className="absolute -bottom-6 left-4 size-16 border-2 border-emerald-500/60 ring-2 ring-[#0d1526]">
            <AvatarImage src={profileImageUrl || undefined} alt="Profile" />
            <AvatarFallback className="bg-emerald-500/20 text-lg text-emerald-400">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="mt-8 space-y-2">
          <div>
            <h3 className="font-semibold text-white">{displayName}</h3>
            {username && <p className="text-sm text-zinc-400">@{username}</p>}
          </div>
          <MembershipBadge tier={membershipTier} />
          {(specialization || location) && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {specialization && <span>{specialization}</span>}
              {specialization && location && <span>•</span>}
              {location && <span>{location}</span>}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-white">{metrics.rating_avg}</span>
            <span className="text-zinc-500">({metrics.rating_count})</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="size-4 text-zinc-400" />
            <span className="font-medium text-white">{metrics.bookings_total}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="size-4 text-zinc-400" />
            <span className="font-medium text-white">{metrics.rating_count}</span>
          </div>
        </div>

        <div className="h-px bg-white/8" />

        {/* Profile Completeness */}
        <div className="space-y-3 rounded-xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Profile Complete</span>
            <span className="text-lg font-semibold text-white">{profileCompleteness}%</span>
          </div>
          <Progress
            value={profileCompleteness}
            className="h-2 bg-white/10 *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-emerald-500 *:data-[slot=progress-indicator]:to-cyan-500"
          />
          {profileCompleteness < 80 && (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-400" />
                <p className="text-xs text-orange-300">
                  Complete your profile to unlock more bookings
                </p>
              </div>
              <Button className="w-full bg-emerald-500 text-white hover:bg-emerald-600" size="sm">
                Finish Profile
              </Button>
            </>
          )}
        </div>

        <div className="h-px bg-white/8" />

        {/* Wolistic Coins Widget */}
        <div className="space-y-3 rounded-xl border border-amber-400/20 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-400/20 p-2">
              <Coins className="size-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-zinc-400">Wolistic Coins</p>
              <p className="text-2xl font-bold text-amber-400">{coinBalance}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400">Earn coins by completing sessions</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Next reward</span>
              <span className="text-amber-400">500 pts</span>
            </div>
            <Progress
              value={Math.min((coinBalance / 500) * 100, 100)}
              className="h-1.5 bg-white/10 *:data-[slot=progress-indicator]:bg-linear-to-r *:data-[slot=progress-indicator]:from-amber-400 *:data-[slot=progress-indicator]:to-orange-400"
            />
          </div>
        </div>

        {showUpgradeCard && (
          <>
            <div className="h-px bg-white/8" />
            {/* Upgrade CTA */}
            <div className="space-y-3 rounded-xl border border-amber-400/30 bg-linear-to-br from-amber-500/20 via-orange-500/15 to-rose-500/10 p-4 shadow-[0_0_20px_rgba(251,191,36,0.15)] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-400/20 p-2">
                  <Crown className="size-5 text-amber-400" />
                </div>
                <h4 className="font-semibold text-amber-400">Unlock Premium</h4>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  <span>Featured placement in search</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  <span>Advanced analytics dashboard</span>
                </li>
              </ul>
              <Button
                className="w-full bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600"
                size="sm"
              >
                Upgrade Now
              </Button>
              <p className="text-center text-xs text-zinc-400">From ₹999/mo</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
