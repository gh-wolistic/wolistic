"use client";

import Image from "next/image";
import { Search, Bell, Coins, Crown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoLightText from "@/assets/logo_light_text.png";

interface EliteTopHeaderProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  membershipTier: string | null;
  coinBalance: number;
  unreadNotifications?: number;
  sidebarCollapsed?: boolean;
  onSignOut?: () => void;
}

const notifications = [
  { id: "1", title: "New booking request", time: "5m ago", unread: true },
  { id: "2", title: "Review received from Amit Kumar", time: "2h ago", unread: true },
  { id: "3", title: "Profile tip: Add more availability", time: "1d ago", unread: false },
  { id: "4", title: "Payment processed: ₹1,200", time: "2d ago", unread: false },
  { id: "5", title: "New message from Sneha Patel", time: "3d ago", unread: false },
];

function MembershipBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;

  const config: Record<string, { color: string; label: string; icon?: boolean }> = {
    basic: { color: "text-zinc-400", label: "Basic" },
    verified: { color: "text-emerald-400", label: "Verified" },
    premium: { color: "text-amber-400", label: "Premium", icon: true },
  };

  const badge = config[tier];
  if (!badge) return null;

  return (
    <div className={`flex items-center gap-1 text-xs ${badge.color}`}>
      {badge.icon && <Crown className="size-3" />}
      <span>{badge.label}</span>
    </div>
  );
}

export function EliteTopHeader({
  userName,
  userEmail,
  userInitials,
  membershipTier,
  coinBalance,
  unreadNotifications = 2,
  sidebarCollapsed = false,
  onSignOut,
}: EliteTopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-[#080d1a]/80 backdrop-blur-xl">
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        {/* Logo — hidden on mobile, shown from lg (sidebar visible) */}
        <div className="hidden items-center lg:flex">
          <Image
            src={logoLightText}
            alt="Wolistic"
            height={28}
            className="h-7 w-auto object-contain"
          />
        </div>

        {/* Desktop Breadcrumb */}
        <div
          className={`hidden items-center gap-2 text-sm transition-all md:flex ${
            sidebarCollapsed ? "lg:ml-17" : "lg:ml-60"
          }`}
        >
          <span className="text-zinc-500">Dashboard</span>
          <span className="text-zinc-500">/</span>
          <span className="text-white">Body Expert Console</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Cluster */}
        <div className="flex items-center gap-2">
          {/* Search — hidden on mobile */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden text-zinc-400 hover:bg-white/5 hover:text-white sm:flex"
                  aria-label="Search"
                >
                  <Search className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-zinc-400 hover:bg-white/5 hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[min(20rem,calc(100vw-1rem))] border-white/10 bg-[#0d1526]/95 backdrop-blur-xl"
            >
              <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="flex items-start gap-2 py-3 text-zinc-300 hover:bg-white/5 focus:bg-white/5"
                  >
                    {notif.unread && (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-emerald-400" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{notif.title}</p>
                      <p className="text-xs text-zinc-500">{notif.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Coin Balance */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-default items-center gap-1.5 rounded-full border border-amber-400/30 bg-linear-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1.5 sm:gap-2 sm:px-3">
                  <Coins className="size-4 shrink-0 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    <span className="hidden sm:inline">{coinBalance} pts</span>
                    <span className="sm:hidden">{coinBalance}</span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Wolistic Coins</p>
                <p className="text-xs text-zinc-400">Earn by completing sessions and referrals</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-white/5" aria-label="User menu">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[min(16rem,calc(100vw-1rem))] border-white/10 bg-[#0d1526]/95 backdrop-blur-xl"
            >
              <div className="px-2 py-3">
                <p className="font-medium text-white">{userName}</p>
                <p className="break-all text-sm text-zinc-400">{userEmail}</p>
                <div className="mt-2">
                  <MembershipBadge tier={membershipTier} />
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-zinc-300 hover:bg-white/5 focus:bg-white/5">
                View Public Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 hover:bg-white/5 focus:bg-white/5">
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 hover:bg-white/5 focus:bg-white/5">
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 hover:bg-white/5 focus:bg-white/5">
                Billing &amp; Plans
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-rose-400 hover:bg-white/5 focus:bg-white/5"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
