"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Activity,
  Users,
  CalendarDays,
  Kanban,
  MessageSquare,
  Star,
  UserSquare2,
  Settings,
  Gem,
  Coins,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/components/ui/utils";
import logoLightText from "@/assets/logo_light_text.png";
import type { ElitePageView } from "./types";

interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: boolean;
  section: "main" | "upgrade";
  special?: "upgrade" | "coins";
  page?: ElitePageView;
  href?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", section: "main", page: "dashboard" },
  { icon: Activity, label: "Body Expert Console", section: "main", page: "dashboard" },
  { icon: Users, label: "Clients", section: "main", page: "clients" },
  { icon: CalendarDays, label: "Schedule", section: "main" },
  { icon: MessageSquare, label: "Messages", badge: true, section: "main" },
  { icon: Star, label: "Reviews", section: "main" },
  { icon: Kanban, label: "Activity Manager", section: "main", page: "activities" },
  { icon: CalendarDays, label: "Classes & Sessions", section: "main", page: "classes" },
  { icon: UserSquare2, label: "Profile Studio", section: "main", page: "profile" },
  { icon: Settings, label: "Settings", section: "main", page: "settings" },
  { icon: Gem, label: "Subscription", special: "upgrade", section: "upgrade", page: "subscription" },
  { icon: Coins, label: "Wolistic Coins", special: "coins", section: "upgrade", page: "coins" },
];

interface EliteSideNavProps {
  userInitials?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  currentPage?: ElitePageView;
  onPageChange?: (page: ElitePageView) => void;
  onSignOut?: () => void;
}

function NavContent({
  collapsed,
  userInitials,
  currentPage = "dashboard",
  onPageChange,
  onSignOut,
}: {
  collapsed: boolean;
  userInitials: string;
  currentPage?: ElitePageView;
  onPageChange?: (page: ElitePageView) => void;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-white/8 px-4">
        {collapsed ? (
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-600 via-emerald-700 to-amber-600 shadow-lg">
            <div className="text-sm font-bold text-white">W</div>
          </div>
        ) : (
          <Image
            src={logoLightText}
            alt="Wolistic"
            height={32}
            className="h-8 w-auto object-contain"
          />
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main Nav */}
        <div className="space-y-1">
          {navItems
            .filter((item) => item.section === "main")
            .map((item) => {
              const Icon = item.icon;
              const isActive = item.page === currentPage;
              return (
                <button
                  key={item.label}
                  onClick={() => item.page && onPageChange?.(item.page)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-white/8 text-white before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-emerald-500"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && <span className="size-2 rounded-full bg-rose-400" />}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-400" />
                  )}
                </button>
              );
            })}
        </div>

        {/* Upgrade Section */}
        <div className="mt-6">
          <div className="mb-2 px-3 text-xs font-medium text-zinc-500">
            {collapsed ? "━" : "UPGRADE"}
          </div>
          <div className="space-y-1">
            {navItems
              .filter((item) => item.section === "upgrade")
              .map((item) => {
                const Icon = item.icon;
                const isActive = item.page === currentPage;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.page && onPageChange?.(item.page)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-white/8 text-white before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-amber-500"
                        : item.special === "upgrade"
                          ? "border border-amber-400/20 bg-linear-to-r from-amber-500/10 to-orange-500/10 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)] hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                          : "text-amber-400 hover:bg-amber-400/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        item.special === "upgrade" && !isActive && "animate-pulse",
                      )}
                    />
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <button
              onClick={onSignOut}
              className="ml-auto rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EliteSideNav({
  userInitials = "WL",
  collapsed: controlledCollapsed,
  onCollapsedChange,
  currentPage = "dashboard",
  onPageChange,
  onSignOut,
}: EliteSideNavProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  return (
    <>
      {/* Mobile Menu */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-4 z-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 border-white/8 bg-[#080d1a]/95 p-0 backdrop-blur-2xl"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <NavContent
              collapsed={false}
              userInitials={userInitials}
              currentPage={currentPage}
              onPageChange={onPageChange}
              onSignOut={onSignOut}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 hidden h-screen border-r border-white/8 bg-[#080d1a]/90 backdrop-blur-2xl transition-all duration-300 lg:block",
          collapsed ? "w-17" : "w-60",
        )}
      >
        <NavContent
          collapsed={collapsed}
          userInitials={userInitials}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onSignOut={onSignOut}
        />

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 rounded-full border border-white/8 bg-[#080d1a] p-1 text-zinc-400 shadow-lg transition-colors hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </button>
      </aside>
    </>
  );
}
