"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { useCoinWallet } from "@/hooks/use-coin-wallet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const COIN_TO_INR_RATE = 0.5;
const MAX_REDEMPTION_PCT = 20;

type CoinRedemptionInputProps = {
  grandTotal: number;
  value: number;
  onChange: (coins: number) => void;
};

export function CoinRedemptionInput({ grandTotal, value, onChange }: CoinRedemptionInputProps) {
  const { wallet, loading } = useCoinWallet();
  const [inputStr, setInputStr] = useState(value > 0 ? String(value) : "");

  const maxByBalance = wallet?.balance ?? 0;
  const maxByTotal = Math.floor((grandTotal * MAX_REDEMPTION_PCT) / 100 / COIN_TO_INR_RATE);
  const maxCoins = Math.min(maxByBalance, maxByTotal);
  const discount = value * COIN_TO_INR_RATE;

  useEffect(() => {
    if (value === 0) setInputStr("");
  }, [value]);

  function handleChange(raw: string) {
    setInputStr(raw);
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) {
      onChange(0);
      return;
    }
    onChange(Math.min(parsed, maxCoins));
  }

  if (loading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }

  if (!wallet || wallet.balance === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="coins_to_use" className="flex items-center gap-1.5 text-amber-300">
          <Coins className="h-4 w-4" />
          Use Coins
        </Label>
        <span className="text-xs text-amber-200/70">
          {wallet.balance.toLocaleString()} available · max {maxCoins.toLocaleString()} here
        </span>
      </div>

      <Input
        id="coins_to_use"
        type="number"
        min={0}
        max={maxCoins}
        value={inputStr}
        placeholder={`0 – ${maxCoins}`}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-white/5 border-amber-500/30 text-white placeholder:text-white/30"
      />

      {value > 0 && (
        <p className="text-xs text-emerald-300">
          -{value.toLocaleString()} coins saves ₹{discount.toFixed(2)} on your order
        </p>
      )}
    </div>
  );
}
