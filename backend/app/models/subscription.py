from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SubscriptionPlan(Base):
    """
    A subscription plan definition, scoped by expert_type (body/mind/diet/all).
    
    Comprehensive Limits Schema (stored in JSONB 'limits' field):
    
    PROFILE LIMITS (Common Infrastructure):
    - certificates_limit (int): Max verified certifications
    - languages_limit (int): Max languages offered
    - education_items_limit (int): Max education entries
    - expertise_areas_limit (int): Max expertise tags
    - approaches_limit (int): Max therapeutic approaches
    - subcategories_limit (int): Max service subcategories
    - gallery_items_limit (int): Max gallery photos/videos
    - booking_questions_limit (int): Max custom booking questions
    
    OPERATIONAL LIMITS (Tier-Based Features):
    - services_limit (int): Max active service offerings
    - booking_slots_limit (int): Max availability slots per month
    - client_invites_per_day (int): Max client invites per day
    - client_invites_per_month (int): Max client invites per month
    - leads_per_day (int): Max new leads accepted per day
    - leads_total_limit (int): Max total active leads
    - followups_per_day (int): Max follow-ups created per day
    - followups_total_limit (int): Max active follow-ups
    - routines_limit (int): Max active client routines
    - routine_templates_limit (int): Max reusable routine templates
    - group_classes_limit (int): Max active group classes
    - activity_manager_yet_to_start_cap (int): Max "yet to start" items
    - activity_manager_in_progress_cap (int): Max "in progress" items
    - classes_sessions_limit (int): Max total classes/sessions
    - messages_retention_days (int): Chat history retention (days)
    
    FUTURE LIMITS (Phase 2+):
    - jobs_marketplace_applications_per_month (int)
    - priority_matchmaking_weight (float)
    - ai_routine_credits_per_month (int)
    - custom_client_filters_limit (int)
    - feed_posts_per_week (int)
    - client_showcase_slots (int)
    
    FEATURE FLAGS:
    - can_reply_to_reviews (bool): Can respond to reviews
    - can_receive_reviews (bool): Can receive reviews
    - featured_in_search (bool): Boosted search ranking
    - priority_support (bool): Priority customer support
    - ai_routine_privacy (bool): AI can't read routines
    - white_label_branding (bool): Custom branding
    - dedicated_account_manager (bool): Personal account manager
    - brand_collaboration_priority (bool): Priority brand access
    
    MULTIPLIERS:
    - coin_multiplier (float): Coin earn rate multiplier
    - search_ranking_boost (float): Search ranking boost
    - review_weight_multiplier (float): Review credibility weight
    """

    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    # body | mind | diet | all
    expert_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, server_default="all")
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # free | pro | elite | celeb
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
    # Mark tier as "coming soon" (not assignable to professionals yet)
    coming_soon: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
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
