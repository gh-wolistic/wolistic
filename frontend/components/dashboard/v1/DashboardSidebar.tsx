"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardNavSection } from "@/components/dashboard/v1/navigation";
import { cn } from "@/components/ui/utils";

type DashboardSidebarProps = {
  sections: DashboardNavSection[];
  onSignOut: () => Promise<void>;
  onNavigate?: () => void;
  className?: string;
};

export function DashboardSidebar({ sections, onSignOut, onNavigate, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-full flex-col border-r border-zinc-200 bg-white", className)}>
      <div className="border-b border-zinc-200 px-5 py-4">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Wolistic</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-900">Dashboard v1</h2>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <section key={section.id}>
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{section.title}</p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={`${section.id}-${item.label}-${item.href}`}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => void onSignOut()}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
