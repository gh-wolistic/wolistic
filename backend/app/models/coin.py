"""Coin system models — wallet, ledger, and rule configuration."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CoinWallet(Base):
    """One row per user — cached balance for fast reads."""

    __tablename__ = "coin_wallets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lifetime_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lifetime_redeemed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CoinTransaction(Base):
    """Append-only ledger — every balance change is a row here."""

    __tablename__ = "coin_transactions"
    __table_args__ = (
        # Idempotency: same event on the same reference is awarded once only.
        # NULL values are excluded from uniqueness checks in PostgreSQL, so
        # admin_adjustment / welcome_bonus (NULL reference) never collide here.
        UniqueConstraint(
            "user_id",
            "event_type",
            "reference_type",
            "reference_id",
            name="uq_coin_txn_idempotency",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Positive = earn; negative = redeem / deduct.
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    # Snapshot of the wallet balance immediately after this transaction.
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # Optional reference to the source record (booking id, user id, etc.).
    reference_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )


class CoinRule(Base):
    """Admin-configurable earn rates — avoids code deploys for rate changes."""

    __tablename__ = "coin_rules"

    event_type: Mapped[str] = mapped_column(String(64), primary_key=True)
    coins_awarded: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # NULL = unlimited; set an integer to cap total awards per user for this event.
    max_per_user: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # NULL = no cooldown; set days to prevent repeated awards within that window.
    cooldown_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
