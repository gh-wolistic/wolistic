"use client";

import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  adminEmail?: string;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export function AdminHeader({ adminEmail, onMenuClick, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-900/70 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs placeholder - will show current page */}
      <div className="flex-1">
        {/* Could add breadcrumbs here based on pathname */}
      </div>

      {/* Admin Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-sm md:inline">{adminEmail || "Admin"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {adminEmail && (
            <DropdownMenuItem disabled>
              <span className="text-xs text-slate-500">{adminEmail}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
