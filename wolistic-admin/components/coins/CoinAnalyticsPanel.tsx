"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Coins, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";
import { adminApi } from "@/lib/admin-api-client";

interface CoinAnalytics {
  total_circulating: number;
  active_wallets: number;
  total_earned_30d: number;
  total_spent_30d: number;
  earned_change_percent: number;
  spent_change_percent: number;
}

export function CoinAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<CoinAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await adminApi.coins.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load coin analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    void loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Coin Analytics</h2>
        <p className="mt-1 text-sm text-slate-400">
          Platform-wide coin economy metrics and trends
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Circulating"
          value={analytics?.total_circulating.toLocaleString() ?? "—"}
          subtitle="Coins in user wallets"
          icon={Coins}
          variant="default"
          loading={loading}
        />
        <MetricCard
          title="Total Earned (30d)"
          value={analytics?.total_earned_30d.toLocaleString() ?? "—"}
          subtitle={analytics ? `${analytics.earned_change_percent > 0 ? "+" : ""}${analytics.earned_change_percent}% from last month` : undefined}
          icon={TrendingUp}
          variant="success"
          loading={loading}
        />
        <MetricCard
          title="Total Spent (30d)"
          value={analytics?.total_spent_30d.toLocaleString() ?? "—"}
          subtitle={analytics ? `${analytics.spent_change_percent > 0 ? "+" : ""}${analytics.spent_change_percent}% from last month` : undefined}
          icon={TrendingDown}
          variant="primary"
          loading={loading}
        />
        <MetricCard
          title="Active Wallets"
          value={analytics?.active_wallets.toLocaleString() ?? "—"}
          subtitle="Users with >0 coins"
          icon={Users}
          variant="default"
          loading={loading}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Coin Flow (30 Days)</h3>
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-slate-500">
              Chart will display coin earning vs. spending trends (coming soon)
            </p>
          </div>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Top Earning Events</h3>
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-slate-500">
              Chart will show most popular coin-earning activities (coming soon)
            </p>
          </div>
        </Card>
      </div>

      {/* Distribution Table Placeholder */}
      <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-semibold text-white">Coin Distribution by User Tier</h3>
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-slate-500">
            Table showing coin balance distribution across Free/Pro/Elite/Celeb users (coming soon)
          </p>
        </div>
      </Card>
    </div>
  );
}
