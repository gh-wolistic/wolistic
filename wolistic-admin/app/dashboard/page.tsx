"use client";

import { useEffect, useState } from "react";
import { Users, UserCog, Shield, Coins as CoinsIcon, CreditCard } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { adminApi } from "@/lib/admin-api-client";
import type { DashboardMetrics } from "@/types/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCompactNumber } from "@/lib/utils";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [registrationData, setRegistrationData] = useState<Array<{ date: string; value: number }>>([]);
  const [revenueData, setRevenueData] = useState<Array<{ date: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        // Load metrics overview
        const metricsData = await adminApi.analytics.getOverview();
        setMetrics(metricsData);

        // Load registration trend (last 30 days)
        const regTrend = await adminApi.analytics.getRegistrationTrend(30);
        setRegistrationData(
          regTrend.map(item => ({
            date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: item.count,
          }))
        );

        // Load revenue trend (last 30 days)
        const revTrend = await adminApi.analytics.getRevenueTrend(30);
        const aggregatedRevenue = revTrend.reduce((acc, item) => {
          const date = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const existing = acc.find(x => x.date === date);
          if (existing) {
            existing.value += item.amount;
          } else {
            acc.push({ date, value: item.amount });
          }
          return acc;
        }, [] as Array<{ date: string; value: number }>);
        setRevenueData(aggregatedRevenue);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard data";
        // Check if it's an authentication error
        if (errorMsg.includes("authenticated") || errorMsg.includes("login")) {
          // Don't show error - user will be redirected by layout
          return;
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Platform overview and key metrics
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Professionals"
          value={metrics ? formatCompactNumber(metrics.total_professionals) : "—"}
          subtitle={
            metrics?.professionals_by_tier
              ? `${metrics.professionals_by_tier.pro + metrics.professionals_by_tier.elite + metrics.professionals_by_tier.celeb} paid subscriptions`
              : undefined
          }
          icon={UserCog}
          loading={loading}
          variant="default"
        />

        <MetricCard
          title="Pending Verifications"
          value={metrics?.pending_verifications ?? "—"}
          subtitle="Awaiting approval"
          icon={Shield}
          loading={loading}
          variant={metrics && metrics.pending_verifications > 10 ? "warning" : "default"}
        />

        <MetricCard
          title="Active Subscriptions"
          value={metrics?.active_subscriptions ?? "—"}
          subtitle="Currently active"
          icon={CreditCard}
          loading={loading}
          variant="primary"
        />

        <MetricCard
          title="Total Users"
          value={metrics ? formatCompactNumber(metrics.total_users) : "—"}
          subtitle="All platform users"
          icon={Users}
          loading={loading}
          variant="default"
        />
      </div>

      {/* Tier Breakdown */}
      {metrics?.professionals_by_tier && !loading && (
        <div className="grid gap-6 sm:grid-cols-4">
          <MetricCard
            title="Free Tier"
            value={metrics.professionals_by_tier.free}
            subtitle="Professionals"
            loading={loading}
          />
          <MetricCard
            title="Pro Tier"
            value={metrics.professionals_by_tier.pro}
            subtitle="₹999/month"
            loading={loading}
            variant="primary"
          />
          <MetricCard
            title="Elite Tier"
            value={metrics.professionals_by_tier.elite}
            subtitle="₹2,499/month"
            loading={loading}
            variant="success"
          />
          <MetricCard
            title="Celeb Tier"
            value={metrics.professionals_by_tier.celeb}
            subtitle="₹9,999/month"
            loading={loading}
            variant="warning"
          />
        </div>
      )}

      {/* Revenue & Coins Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricCard
          title="Total Coins Circulated"
          value={metrics ? formatCompactNumber(metrics.total_coins_circulated) : "—"}
          subtitle="Platform-wide coins in circulation"
          icon={CoinsIcon}
          loading={loading}
        />
        <MetricCard
          title="Booking Revenue"
          value={metrics ? `₹${formatCompactNumber(metrics.revenue_total)}` : "—"}
          subtitle={metrics ? `₹${formatCompactNumber(metrics.revenue_monthly)} this month` : undefined}
          loading={loading}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Registrations (Last 30 Days)"
          data={registrationData}
          loading={loading}
          type="area"
          color="#06b6d4"
        />

        <TrendChart
          title="Subscription Revenue Trend (Last 30 Days)"
          data={revenueData}
          loading={loading}
          type="area"
          color="#10b981"
        />
      </div>

      {/* Activity Feed Placeholder (Phase 2: Audit Log) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-semibold text-white">Recent Activity</h3>
        <p className="text-sm text-slate-500">
          Activity feed will be available once audit logging is integrated (Step 10).
        </p>
      </div>
    </div>
  );
}
