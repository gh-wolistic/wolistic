/** Coin system TypeScript types — mirrors backend schemas/coin.py */

export type CoinWallet = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  tier_name: string;
  tier_next_name: string | null;
  tier_coins_needed: number | null;
  updated_at: string;
};

export type CoinTransaction = {
  id: number;
  amount: number;
  balance_after: number;
  event_type: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
};

export type CoinTransactionPage = {
  items: CoinTransaction[];
  total: number;
  page: number;
  size: number;
};

export type CoinRule = {
  event_type: string;
  coins_awarded: number;
  description: string | null;
};

export type CoinRedemptionRequest = {
  booking_reference: string;
  coins_to_use: number;
};

export type CoinRedemptionResult = {
  coins_used: number;
  discount_amount_inr: number;
  new_balance: number;
};
