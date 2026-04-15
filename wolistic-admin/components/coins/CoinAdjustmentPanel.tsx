"use client";

import { useState } from "react";
import { Search, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { adminApi } from "@/lib/admin-api-client";
import type { CoinWallet } from "@/types/admin";

export function CoinAdjustmentPanel() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setWallet(null);
    setUserId(null);

    try {
      const result = await adminApi.coins.lookupWallet(email);
      setWallet(result.wallet);
      setUserId(result.user_id);
    } catch (err) {
      console.error("Failed to lookup wallet:", err);
      setError(err instanceof Error ? err.message : "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!wallet || !userId) {
      setError("Please lookup a user first");
      return;
    }

    if (adjustAmount === 0) {
      setError("Adjustment amount cannot be zero");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await adminApi.coins.adjust(userId, adjustAmount, notes || undefined);
      // Update wallet balance with the new value
      setWallet({
        ...wallet,
        balance: result.new_balance,
      });
      setSuccess(
        `Successfully ${adjustAmount > 0 ? "added" : "deducted"} ${Math.abs(adjustAmount)} coins. New balance: ${
          result.new_balance
        }`
      );
      setAdjustAmount(0);
      setNotes("");
    } catch (err) {
      console.error("Failed to adjust coins:", err);
      setError(err instanceof Error ? err.message : "Failed to adjust coins");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Manual Coin Adjustments</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add or deduct coins from user wallets with audit trail
        </p>
      </div>

      {/* User Lookup */}
      <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="user-email">User Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleLookup} disabled={loading || !email}>
                <Search className="mr-2 h-4 w-4" />
                Lookup
              </Button>
            </div>
          </div>

          {/* Wallet Display */}
          {wallet && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Current Balance</p>
                  <p className="text-3xl font-bold text-emerald-400">{wallet.balance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Lifetime Earned</p>
                  <p className="text-lg font-semibold text-slate-300">{wallet.lifetime_earned.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Lifetime Redeemed</p>
                  <p className="text-lg font-semibold text-slate-300">{wallet.lifetime_redeemed.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Adjustment Form */}
      {wallet && (
        <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">Make Adjustment</h3>
          <div className="space-y-4">
            {/* Quick Actions */}
            <div>
              <Label className="mb-2 block">Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(10)}
                  className="text-emerald-400"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  +10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(50)}
                  className="text-emerald-400"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  +50
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(100)}
                  className="text-emerald-400"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  +100
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(-10)}
                  className="text-red-400"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  -10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(-50)}
                  className="text-red-400"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  -50
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustAmount(-100)}
                  className="text-red-400"
                >
                  <Minus className="mr-1 h-3 w-3" />
                  -100
                </Button>
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="adjust-amount">Adjustment Amount</Label>
              <Input
                id="adjust-amount"
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                placeholder="Positive to add, negative to deduct"
                className={
                  adjustAmount > 0
                    ? "border-emerald-500/50"
                    : adjustAmount < 0
                    ? "border-red-500/50"
                    : ""
                }
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment"
              />
              <p className="text-xs text-slate-400">
                This will be recorded in the audit log for transparency
              </p>
            </div>

            {/* Submit */}
            <Button onClick={handleAdjust} disabled={loading || adjustAmount === 0} className="w-full">
              {loading
                ? "Processing..."
                : adjustAmount > 0
                ? `Add ${adjustAmount} Coins`
                : adjustAmount < 0
                ? `Deduct ${Math.abs(adjustAmount)} Coins`
                : "Enter Amount"}
            </Button>
          </div>
        </Card>
      )}

      {/* Error/Success */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <AlertDescription className="text-emerald-200">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
