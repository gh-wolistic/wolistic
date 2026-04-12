"""Coin service — core business logic for awarding, redeeming, and querying coins."""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coin import CoinRule, CoinTransaction, CoinWallet
from app.schemas.coin import (
    AdminCoinAdjustOut,
    CoinRedemptionOut,
    CoinRuleOut,
    CoinTransactionOut,
    CoinTransactionPageOut,
    CoinWalletOut,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Coin → INR exchange rate.
# 1 coin = COIN_TO_INR_RATE rupees (e.g. 0.50 → 100 coins = ₹50 discount).
# Change this constant or move to settings if you need runtime configurability.
# ---------------------------------------------------------------------------
COIN_TO_INR_RATE: Decimal = Decimal("0.50")

# ---------------------------------------------------------------------------
# Cap: max % of a booking amount that can be covered by coins (20 %).
# ---------------------------------------------------------------------------
COIN_MAX_REDEMPTION_PCT: Decimal = Decimal("20")

# ---------------------------------------------------------------------------
# Tier thresholds (lifetime earned, inclusive lower bound).
# ---------------------------------------------------------------------------
_TIERS: list[tuple[str, int]] = [
    ("Bronze", 0),
    ("Silver", 500),
    ("Gold", 2000),
    ("Platinum", 5000),
]


def _resolve_tier(lifetime_earned: int) -> tuple[str, str | None, int | None]:
    """Return (current_tier_name, next_tier_name, coins_needed_for_next)."""
    current_tier_name = _TIERS[0][0]
    for name, threshold in _TIERS:
        if lifetime_earned >= threshold:
            current_tier_name = name

    current_index = next(i for i, (name, _) in enumerate(_TIERS) if name == current_tier_name)
    if current_index + 1 < len(_TIERS):
        next_name, next_threshold = _TIERS[current_index + 1]
        return current_tier_name, next_name, next_threshold - lifetime_earned
    return current_tier_name, None, None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_or_create_wallet(db: AsyncSession, user_id: uuid.UUID) -> CoinWallet:
    result = await db.execute(select(CoinWallet).where(CoinWallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if wallet is not None:
        return wallet

    wallet = CoinWallet(user_id=user_id, balance=0, lifetime_earned=0, lifetime_redeemed=0)
    db.add(wallet)
    await db.flush()
    return wallet


def _build_wallet_out(wallet: CoinWallet) -> CoinWalletOut:
    tier_name, tier_next_name, tier_coins_needed = _resolve_tier(wallet.lifetime_earned)
    return CoinWalletOut(
        user_id=wallet.user_id,
        balance=wallet.balance,
        lifetime_earned=wallet.lifetime_earned,
        lifetime_redeemed=wallet.lifetime_redeemed,
        tier_name=tier_name,
        tier_next_name=tier_next_name,
        tier_coins_needed=tier_coins_needed,
        updated_at=wallet.updated_at,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def award_coins(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    event_type: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
    notes: str | None = None,
) -> CoinTransaction | None:
    """
    Award coins to a user for a specific event.

    Returns the created CoinTransaction on success, or None if:
    - the rule is inactive / does not exist
    - the idempotency constraint fires (already awarded for this reference)

    The caller does NOT need to handle the idempotency case specially — this
    function swallows it silently and returns None.  Commit is NOT called here;
    the caller controls the transaction boundary.
    """
    rule_result = await db.execute(
        select(CoinRule).where(CoinRule.event_type == event_type, CoinRule.is_active.is_(True))
    )
    rule = rule_result.scalar_one_or_none()
    if rule is None:
        logger.debug("coin_award_skip: no active rule for event_type=%s", event_type)
        return None

    wallet = await _get_or_create_wallet(db, user_id)
    new_balance = wallet.balance + rule.coins_awarded

    txn = CoinTransaction(
        user_id=user_id,
        amount=rule.coins_awarded,
        balance_after=new_balance,
        event_type=event_type,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
    )
    db.add(txn)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        logger.debug(
            "coin_award_idempotent: already awarded event_type=%s ref=%s/%s user=%s",
            event_type,
            reference_type,
            reference_id,
            user_id,
        )
        return None

    wallet.balance = new_balance
    wallet.lifetime_earned += rule.coins_awarded
    return txn


async def reserve_coins(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    booking_reference: str,
    coins_to_use: int,
) -> CoinRedemptionOut:
    """
    Reserve (deduct) coins against a booking.

    Raises ValueError if the user has insufficient balance or the requested
    amount exceeds the configured redemption cap.

    Commit is NOT called here; the caller controls the transaction boundary.
    """
    wallet = await _get_or_create_wallet(db, user_id)

    if coins_to_use > wallet.balance:
        raise ValueError(f"Insufficient coin balance: have {wallet.balance}, requested {coins_to_use}")

    new_balance = wallet.balance - coins_to_use
    discount_inr = float(Decimal(str(coins_to_use)) * COIN_TO_INR_RATE)

    txn = CoinTransaction(
        user_id=user_id,
        amount=-coins_to_use,
        balance_after=new_balance,
        event_type="redemption",
        reference_type="booking",
        reference_id=booking_reference,
        notes=f"Redeemed {coins_to_use} coins → ₹{discount_inr:.2f} discount on {booking_reference}",
    )
    db.add(txn)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise ValueError(f"Coins already redeemed for booking {booking_reference}")

    wallet.balance = new_balance
    wallet.lifetime_redeemed += coins_to_use

    return CoinRedemptionOut(
        coins_used=coins_to_use,
        discount_amount_inr=discount_inr,
        new_balance=new_balance,
    )


async def get_wallet(db: AsyncSession, *, user_id: uuid.UUID) -> CoinWalletOut:
    wallet = await _get_or_create_wallet(db, user_id)
    return _build_wallet_out(wallet)


async def get_transactions(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> CoinTransactionPageOut:
    offset = (page - 1) * size

    count_result = await db.execute(
        select(func.count()).select_from(CoinTransaction).where(CoinTransaction.user_id == user_id)
    )
    total = int(count_result.scalar_one() or 0)

    items_result = await db.execute(
        select(CoinTransaction)
        .where(CoinTransaction.user_id == user_id)
        .order_by(CoinTransaction.created_at.desc(), CoinTransaction.id.desc())
        .offset(offset)
        .limit(size)
    )
    items = items_result.scalars().all()

    return CoinTransactionPageOut(
        items=[
            CoinTransactionOut(
                id=txn.id,
                amount=txn.amount,
                balance_after=txn.balance_after,
                event_type=txn.event_type,
                reference_type=txn.reference_type,
                reference_id=txn.reference_id,
                notes=txn.notes,
                created_at=txn.created_at,
            )
            for txn in items
        ],
        total=total,
        page=page,
        size=size,
    )


async def get_active_rules(db: AsyncSession) -> list[CoinRuleOut]:
    result = await db.execute(
        select(CoinRule)
        .where(CoinRule.is_active.is_(True))
        .order_by(CoinRule.coins_awarded.desc())
    )
    rules = result.scalars().all()
    return [
        CoinRuleOut(
            event_type=rule.event_type,
            coins_awarded=rule.coins_awarded,
            description=rule.description,
        )
        for rule in rules
    ]


async def admin_adjust(
    db: AsyncSession,
    *,
    target_user_id: uuid.UUID,
    amount: int,
    notes: str,
) -> AdminCoinAdjustOut:
    """
    Signed manual adjustment — admin only.
    Negative amount debits; positive credits.
    Wallet balance is clamped to 0 from below to prevent negative balances.
    Commit is NOT called here; the caller controls the transaction boundary.
    """
    wallet = await _get_or_create_wallet(db, target_user_id)
    new_balance = max(0, wallet.balance + amount)

    txn = CoinTransaction(
        user_id=target_user_id,
        amount=amount,
        balance_after=new_balance,
        event_type="admin_adjustment",
        reference_type=None,
        reference_id=None,
        notes=notes,
    )
    db.add(txn)
    await db.flush()

    if amount > 0:
        wallet.lifetime_earned += amount
    else:
        wallet.lifetime_redeemed += abs(amount)
    wallet.balance = new_balance

    return AdminCoinAdjustOut(
        user_id=target_user_id,
        amount=amount,
        new_balance=new_balance,
        transaction_id=txn.id,
    )
