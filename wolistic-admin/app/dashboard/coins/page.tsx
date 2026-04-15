"use client";

import { useState } from "react";
import { Coins, TrendingUp, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinRulesPanel } from "@/components/coins/CoinRulesPanel";
import { CoinAdjustmentPanel } from "@/components/coins/CoinAdjustmentPanel";
import { CoinAnalyticsPanel } from "@/components/coins/CoinAnalyticsPanel";

export default function CoinsPage() {
  const [activeTab, setActiveTab] = useState("rules");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Coin Management</h1>
        <p className="mt-2 text-slate-400">
          Manage coin rules, manual adjustments, and platform economy
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-2">
            <Coins className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <CoinRulesPanel />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <CoinAdjustmentPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <CoinAnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
