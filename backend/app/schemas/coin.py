"""Pydantic schemas for the coin system."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Wallet
# ---------------------------------------------------------------------------


class CoinWalletOut(BaseModel):
    user_id: uuid.UUID
    balance: int
    lifetime_earned: int
    lifetime_redeemed: int
    # Derived tier info returned for UI display.
    tier_name: str
    tier_next_name: str | None
    tier_coins_needed: int | None
    updated_at: datetime


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------


class CoinTransactionOut(BaseModel):
    id: int
    amount: int
    balance_after: int
    event_type: str
    reference_type: str | None
    reference_id: str | None
    notes: str | None
    created_at: datetime


class CoinTransactionPageOut(BaseModel):
    items: list[CoinTransactionOut]
    total: int
    page: int
    size: int


# ---------------------------------------------------------------------------
# Redemption
# ---------------------------------------------------------------------------


class CoinRedemptionIn(BaseModel):
    booking_reference: str = Field(..., min_length=1, max_length=128)
    coins_to_use: int = Field(..., ge=1)


class CoinRedemptionOut(BaseModel):
    coins_used: int
    discount_amount_inr: float
    new_balance: int


# ---------------------------------------------------------------------------
# Rules (public read)
# ---------------------------------------------------------------------------


class CoinRuleOut(BaseModel):
    event_type: str
    coins_awarded: int
    description: str | None


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


class AdminCoinAdjustIn(BaseModel):
    user_id: uuid.UUID
    amount: int = Field(..., description="Positive to credit, negative to debit")
    notes: str = Field(..., min_length=1, max_length=500)


class AdminCoinAdjustOut(BaseModel):
    user_id: uuid.UUID
    amount: int
    new_balance: int
    transaction_id: int
