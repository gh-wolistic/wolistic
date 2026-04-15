from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SubscriptionPlan(Base):
    """A subscription plan definition, scoped by expert_type (body/mind/diet/all)."""

    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    # body | mind | diet | all
    expert_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, server_default="all")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # free | pro | elite
    tier: Mapped[str] = mapped_column(String(32), nullable=False, server_default="free")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_monthly: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    price_yearly: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    # JSONB: list of feature strings e.g. ["search_boost", "featured", "group_classes"]
    features: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="[]")
    # JSONB: e.g. {"services_limit": 10, "coin_multiplier": 2, "group_classes_limit": 5}
    limits: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ProfessionalSubscription(Base):
    """Active subscription record for a professional (one active row per professional)."""

    __tablename__ = "professional_subscriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # active | grace | expired | cancelled
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="active")
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    # self_paid | admin_upgrade | offer_redemption | partner_sponsored
    subscription_type: Mapped[str] = mapped_column(String(32), nullable=False, server_default="self_paid")
    offer_assignment_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("offer_assignments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    auto_downgrade_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    auto_downgrade_to_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SubscriptionBillingRecord(Base):
    """Immutable payment log entry for a subscription charge."""

    __tablename__ = "subscription_billing_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, server_default="INR")
    # razorpay | manual | bank
    method: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SubscriptionPaymentOrder(Base):
    """Tracks a Razorpay order created for a subscription upgrade."""

    __tablename__ = "subscription_payment_orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    provider_order_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, server_default="INR")
    # created | success | failure
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="created")
    provider_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_signature: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SubscriptionPriorityTicket(Base):
    """A request from an unverified professional to be considered for a subscription upgrade."""

    __tablename__ = "subscription_priority_tickets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # open | in_progress | resolved
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
