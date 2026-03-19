"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";

import type { AuthSessionUser } from "@/components/auth/AuthSessionProvider";
import { DASHBOARD_V1_PATHS } from "@/components/dashboard/v1/routing";
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

function initialsFor(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "WU";
}

type DashboardHeaderProps = {
  user: AuthSessionUser;
  onMenuClick: () => void;
  onSignOut: () => Promise<void>;
};

export function DashboardHeader({ user, onMenuClick, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Signed in</p>
            <p className="text-sm font-medium text-zinc-800">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="h-10 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initialsFor(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={DASHBOARD_V1_PATHS.profile.viewAsPublic}>View as public</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={DASHBOARD_V1_PATHS.profile.edit}>Edit / update profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={DASHBOARD_V1_PATHS.profile.settings}>Profile settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{user.userType === "partner" ? "Partner" : "Client"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onSignOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
