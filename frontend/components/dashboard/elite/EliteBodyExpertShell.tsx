"use client";

import { useCallback, useEffect, useState } from "react";

import Loading from "@/app/loading";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { useCoinWallet } from "@/hooks/use-coin-wallet";
import { getPartnerDashboardData } from "@/components/dashboard/partner/partnerApi";
import type { PartnerDashboardData } from "@/components/dashboard/partner/partnerApi";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

import { EliteSideNav } from "./EliteSideNav";
import { EliteTopHeader } from "./EliteTopHeader";
import { EliteProfilePanel } from "./EliteProfilePanel";
import { BodyExpertDashboardContent } from "./BodyExpertDashboardContent";
import { WolisticCoinsPage } from "./WolisticCoinsPage";
import { ProfileStudioPage } from "@/components/dashboard/profile/ProfileStudioPage";
import { ActivityManagerPage } from "@/components/dashboard/activity/ActivityManagerPage";
import { ClientsManagerPage } from "./ClientsManagerPage";
import ClientsManagerV2Page from "./ClientsManagerV2Page";
import { SettingsPage } from "./SettingsPage";
import { ClassesManagerPage } from "./ClassesManagerPage";
import { SubscriptionPage } from "./SubscriptionPage";
import { MessagingPage } from "../MessagingPage";
import type { ElitePageView } from "./types";

/** Derive profile completeness as a percentage from the editor payload. */
function computeProfileCompleteness(editor: ProfessionalEditorPayload): number {
  let score = 0;
  if (editor.username?.trim()) score += 10;
  if (editor.short_bio?.trim()) score += 15;
  if (editor.about?.trim()) score += 15;
  if (editor.specialization?.trim()) score += 10;
  if (editor.location?.trim()) score += 10;
  if (editor.services?.length > 0) score += 15;
  if (editor.availability_slots?.length > 0) score += 10;
  if (editor.certifications?.length > 0) score += 10;
  if (editor.expertise_areas?.length > 0) score += 5;
  return score;
}

/** Derive two-letter initials from a full name. */
function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface EliteBodyExpertShellProps {
  initialPage?: ElitePageView;
}

export function EliteBodyExpertShell({ initialPage = "dashboard" }: EliteBodyExpertShellProps = {}) {
  const { user, accessToken, signOut, status } = useAuthSession();
  const { wallet, refresh: refreshWallet } = useCoinWallet();

  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<ElitePageView>(initialPage);

  const loadDashboard = useCallback(() => {
    if (!accessToken) return;
    setDataLoading(true);
    refreshWallet();
    getPartnerDashboardData(accessToken)
      .then((data) => setDashboardData(data))
      .catch(() => setDashboardData(null))
      .finally(() => setDataLoading(false));
  }, [accessToken, refreshWallet]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (status === "loading" || (status === "authenticated" && dataLoading)) {
    return <Loading />;
  }

  if (!user || !dashboardData?.aggregate) {
    return <Loading />;
  }

  const { editor, aggregate, recentCoinTransactions } = dashboardData;

  const profileCompleteness = computeProfileCompleteness(editor);
  const userInitials = toInitials(user.name);
  const coinBalance = wallet?.balance ?? 0;
  const membershipTier =
    aggregate.overview.membership_tier ?? editor.membership_tier ?? null;
  const specialization =
    aggregate.overview.specialization ?? editor.specialization ?? null;
  const location = aggregate.overview.location ?? editor.location ?? null;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Side Navigation */}
      <EliteSideNav
        userInitials={userInitials}
        userSubtype={user.userSubtype}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onSignOut={signOut}
      />

      {/* Top Header */}
      <EliteTopHeader
        userName={user.name}
        userEmail={user.email}
        userInitials={userInitials}
        membershipTier={membershipTier}
        coinBalance={coinBalance}
        sidebarCollapsed={sidebarCollapsed}
        onSignOut={signOut}
      />

      {/* Main Content Area */}
      <main
        className={`${currentPage === "messages" ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-screen overflow-x-hidden"} pt-16 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-17" : "lg:pl-60"
        } ${currentPage === "dashboard" ? "xl:pr-72" : ""}`}
      >
        {currentPage === "dashboard" && (
          <BodyExpertDashboardContent
            aggregate={aggregate}
            userStatus={user.userStatus}
            profileCompleteness={profileCompleteness}
            wallet={wallet}
            displayName={user.name}
            services={editor.services ?? []}
            availability={editor.availability_slots ?? []}
            coinTransactions={recentCoinTransactions}
            editorPayload={editor}
            onSaved={loadDashboard}
            onPageChange={setCurrentPage}
          />
        )}
        {currentPage === "coins" && <WolisticCoinsPage />}
        {currentPage === "profile" && <ProfileStudioPage />}
        {currentPage === "settings" && (
          <SettingsPage
            userName={user.name}
            userEmail={user.email}
            membershipTier={membershipTier}
            onNavigateToSubscription={() => setCurrentPage("subscription")}
          />
        )}
        {currentPage === "activities" && <ActivityManagerPage />}
        {currentPage === "clients" && <ClientsManagerV2Page />}
        {currentPage === "classes" && (
          <ClassesManagerPage
            specialization={editor.specialization ?? ""}
            subcategories={editor.subcategories ?? []}
          />
        )}
        {currentPage === "subscription" && <SubscriptionPage />}
        {currentPage === "messages" && (
          <div className="h-full">
            <MessagingPage />
          </div>
        )}
      </main>

      {/* Right Profile Panel — dashboard view only */}
      {currentPage === "dashboard" && (
        <EliteProfilePanel
          displayName={user.name}
          username={editor.username}
          specialization={specialization}
          location={location}
          membershipTier={membershipTier}
          metrics={aggregate.metrics}
          profileCompleteness={profileCompleteness}
          wallet={wallet}
          coverImageUrl={editor.cover_image_url}
          profileImageUrl={editor.profile_image_url}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
