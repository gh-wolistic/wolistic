"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getCoinWallet } from "@/components/dashboard/coins/coinApi";
import type { CoinWallet } from "@/types/coins";

export interface UseCoinWalletResult {
  wallet: CoinWallet | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCoinWallet(): UseCoinWalletResult {
  const { accessToken: token } = useAuthSession();
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getCoinWallet(token)
      .then((data) => setWallet(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load wallet"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { wallet, loading, error, refresh: fetch };
}
