"""Coin system API routes."""

from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user, require_admin_api_key
from app.core.database import get_db_session
from app.models.user import User
from app.schemas.coin import (
    AdminCoinAdjustIn,
    AdminCoinAdjustOut,
    CoinRedemptionIn,
    CoinRedemptionOut,
    CoinRuleOut,
    CoinTransactionPageOut,
    CoinWalletOut,
)
from app.services.coins import (
    admin_adjust,
    award_coins,
    get_active_rules,
    get_transactions,
    get_wallet,
    reserve_coins,
)
from sqlalchemy import select

router = APIRouter(prefix="/coins", tags=["coins"])


@router.get("/me/wallet", response_model=CoinWalletOut)
async def get_my_coin_wallet(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CoinWalletOut:
    """Return the authenticated user's coin wallet — creates it on first call."""
    return await get_wallet(db, user_id=current_user.user_id)


@router.get("/me/transactions", response_model=CoinTransactionPageOut)
async def get_my_coin_transactions(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CoinTransactionPageOut:
    """Paginated coin transaction history for the authenticated user."""
    return await get_transactions(db, user_id=current_user.user_id, page=page, size=size)


@router.post("/me/redeem", response_model=CoinRedemptionOut)
async def redeem_coins(
    payload: CoinRedemptionIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CoinRedemptionOut:
    """
    Reserve coins against an existing booking order.

    Deducts coins from the wallet immediately; if the booking is later
    cancelled the refund must be issued via an admin adjustment (Phase 2).
    """
    try:
        result = await reserve_coins(
            db,
            user_id=current_user.user_id,
            booking_reference=payload.booking_reference,
            coins_to_use=payload.coins_to_use,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    await db.commit()
    return result


@router.get("/rules", response_model=list[CoinRuleOut])
async def list_coin_rules(
    db: AsyncSession = Depends(get_db_session),
) -> list[CoinRuleOut]:
    """Public endpoint — returns all active earn rules (for 'How to earn' UI)."""
    return await get_active_rules(db)


@router.post("/me/checkin", response_model=CoinWalletOut)
async def daily_checkin(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CoinWalletOut:
    """
    Daily check-in — awards coins once per calendar day (UTC).

    Uses today's date as idempotency reference_id so the unique constraint
    prevents double-awards within the same day across retries or multiple devices.
    Returns the user's updated wallet.
    """
    today_str = date.today().isoformat()  # e.g. "2026-04-11"
    await award_coins(
        db,
        user_id=current_user.user_id,
        event_type="daily_checkin",
        reference_type="date",
        reference_id=today_str,
        notes=f"Daily check-in on {today_str}",
    )
    await db.commit()
    return await get_wallet(db, user_id=current_user.user_id)


# ---------------------------------------------------------------------------
# Admin endpoints — protected by admin API key
# ---------------------------------------------------------------------------


@router.post(
    "/admin/adjust",
    response_model=AdminCoinAdjustOut,
    dependencies=[Depends(require_admin_api_key)],
)
async def admin_coin_adjustment(
    payload: AdminCoinAdjustIn,
    db: AsyncSession = Depends(get_db_session),
) -> AdminCoinAdjustOut:
    """
    Signed manual coin adjustment (admin only).
    Positive amount = credit; negative = debit (clamped to 0).
    """
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    result = await admin_adjust(
        db,
        target_user_id=payload.user_id,
        amount=payload.amount,
        notes=payload.notes,
    )
    await db.commit()
    return result


@router.get(
    "/admin/wallet/{user_id}",
    response_model=CoinWalletOut,
    dependencies=[Depends(require_admin_api_key)],
)
async def admin_get_user_wallet(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
) -> CoinWalletOut:
    """Return any user's wallet — admin only."""
    return await get_wallet(db, user_id=user_id)


@router.get(
    "/admin/lookup",
    dependencies=[Depends(require_admin_api_key)],
)
async def admin_lookup_user_by_email(
    email: str = Query(..., description="User email address"),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    Lookup user by email and return their coin wallet + recent transactions.
    
    Returns:
        {
            "user_id": "uuid",
            "email": "user@example.com",
            "wallet": {...},
            "transactions": {...}
        }
    """
    # Find user by email
    user_result = await db.execute(
        select(User).where(User.email == email.strip().lower())
    )
    user = user_result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found"
        )
    
    # Get wallet and transactions
    wallet = await get_wallet(db, user_id=user.id)
    transactions = await get_transactions(db, user_id=user.id, page=1, size=20)
    
    return {
        "user_id": str(user.id),
        "email": user.email,
        "wallet": wallet.model_dump(),
        "transactions": transactions.model_dump(),
    }


@router.get(
    "/admin/transactions/{user_id}",
    response_model=CoinTransactionPageOut,
    dependencies=[Depends(require_admin_api_key)],
)
async def admin_get_user_transactions(
    user_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> CoinTransactionPageOut:
    """Return paginated ledger for any user — admin only."""
    return await get_transactions(db, user_id=user_id, page=page, size=size)
