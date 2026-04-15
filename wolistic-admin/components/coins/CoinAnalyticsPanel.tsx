"use client";

import { TrendingUp, TrendingDown, Coins, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";

export function CoinAnalyticsPanel() {
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
          value="0"
          subtitle="Coins in user wallets"
          icon={Coins}
          variant="default"
        />
        <MetricCard
          title="Total Earned (30d)"
          value="0"
          subtitle="+0% from last month"
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Total Spent (30d)"
          value="0"
          subtitle="+0% from last month"
          icon={TrendingDown}
          variant="primary"
        />
        <MetricCard
          title="Active Wallets"
          value="0"
          subtitle="Users with >0 coins"
          icon={Users}
          variant="default"
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
