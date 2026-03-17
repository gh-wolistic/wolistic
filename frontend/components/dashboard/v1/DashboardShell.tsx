"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import type { AuthSessionUser } from "@/components/auth/AuthSessionProvider";
import { DashboardHeader } from "@/components/dashboard/v1/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/v1/DashboardSidebar";
import type { DashboardNavSection } from "@/components/dashboard/v1/navigation";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type DashboardShellProps = {
  user: AuthSessionUser;
  sections: DashboardNavSection[];
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

export function DashboardShell({ user, sections, onSignOut, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen">
        <div className="hidden w-72 shrink-0 md:block">
          <DashboardSidebar sections={sections} onSignOut={onSignOut} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader user={user} onMenuClick={() => setMobileNavOpen(true)} onSignOut={onSignOut} />

          {user.userStatus === "pending" && (
            <section className="border-b border-amber-200 bg-amber-50 px-4 py-3 md:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-600 text-white">Verification Pending</Badge>
                <p className="text-sm text-amber-900">
                  Your partner profile verification is in progress. You can continue setting up your dashboard meanwhile.
                </p>
              </div>
            </section>
          )}

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <DashboardSidebar
            sections={sections}
            onSignOut={onSignOut}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
