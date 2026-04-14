"use client";

import { useState } from "react";
import { CalendarCheck, Coins } from "lucide-react";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { dailyCheckin } from "@/components/dashboard/coins/coinApi";
import type { CoinWallet } from "@/types/coins";
import { Button } from "@/components/ui/button";

type DailyCheckinButtonProps = {
  /** Called with the updated wallet after a successful check-in. */
  onCheckin?: (wallet: CoinWallet) => void;
};

export function DailyCheckinButton({ onCheckin }: DailyCheckinButtonProps) {
  const { accessToken: token } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(
    null,
  );

  async function handleCheckin() {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      const wallet = await dailyCheckin(token);
      onCheckin?.(wallet);
      setMessage({ text: "+10 coins — see you tomorrow!", type: "success" });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      // 409 / integrity error = already checked in today
      if (raw.includes("409") || raw.toLowerCase().includes("already")) {
        setMessage({ text: "Already checked in today", type: "info" });
      } else {
        setMessage({ text: raw || "Check-in failed", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => { void handleCheckin(); }}
        className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 gap-1.5"
      >
        <CalendarCheck className="h-4 w-4" />
        {loading ? "Checking in…" : "Daily Check-in"}
        <span className="ml-auto flex items-center gap-0.5 text-xs text-amber-400/70">
          <Coins className="h-3 w-3" />
          +10
        </span>
      </Button>
      {message && (
        <p
          className={`text-xs ${
            message.type === "success"
              ? "text-emerald-400"
              : message.type === "info"
                ? "text-amber-400/70"
                : "text-rose-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
