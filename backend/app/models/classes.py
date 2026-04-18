from __future__ import annotations

import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class WorkLocation(Base):
    """A saved work location belonging to a professional (gym, studio, home, online)."""

    __tablename__ = "work_locations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # gym | studio | home | online
    location_type: Mapped[str] = mapped_column(String(32), nullable=False, server_default="gym")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GroupClass(Base):
    """A recurring group fitness class created by a professional."""

    __tablename__ = "group_classes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    work_location_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("work_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # yoga | zumba | pilates | hiit | dance | other
    category: Mapped[str] = mapped_column(String(32), nullable=False, server_default="other")
    # active | draft | cancelled
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="draft")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="60")
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="20")
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # session | workshop | class (expert's terminology choice)
    display_term: Mapped[str] = mapped_column(String(16), nullable=False, server_default="session")
    # online | in_person | hybrid (session delivery mode)
    session_mode: Mapped[str] = mapped_column(String(16), nullable=False, server_default="in_person")
    # Mandatory expiry date for template lifecycle
    expires_on: Mapped[date] = mapped_column(Date, nullable=False)
    # renewed | cancelled | archived
    expired_action_taken: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ClassSession(Base):
    """A single scheduled session instance for a GroupClass."""

    __tablename__ = "class_sessions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    group_class_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("group_classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    # draft | published | cancelled
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # True = cannot edit date/time/location (has enrollments or interest)
    is_locked: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ClassEnrollment(Base):
    """A client enrollment in a specific ClassSession."""

    __tablename__ = "class_enrollments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    class_session_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("class_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional link to an expert_clients record (for manual enrollments)
    expert_client_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("expert_clients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Link to authenticated user (for public enrollments)
    client_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # confirmed | attended | no_show_client | cancelled_expert | cancelled_client | refunded
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="confirmed")
    # paid | pending
    payment_status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="pending")
    # public | manual (enrollment source)
    source: Mapped[str] = mapped_column(String(16), nullable=False, server_default="manual")
    # Refund tracking
    refund_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    refund_processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refund_provider_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SessionInterest(Base):
    """Client interest tracking for sold-out sessions."""

    __tablename__ = "session_interest"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    class_session_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("class_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class EnrollmentPayment(Base):
    """Payment tracking for session enrollments."""

    __tablename__ = "enrollment_payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    enrollment_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("class_enrollments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # razorpay
    provider_order_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    provider_payment_id: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    provider_signature: Mapped[str | None] = mapped_column(String(512), nullable=True)
    provider_payload: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, server_default="INR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="created")
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ExpertSessionReliability(Base):
    """Expert reliability tracking for session management."""

    __tablename__ = "expert_session_reliability"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    total_sessions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    cancelled_sessions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    late_cancellations: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    no_show_sessions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    reliability_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, server_default="1.0000")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class TierLimit(Base):
    """Tier-based limits configuration for session/class creation."""

    __tablename__ = "tier_limits"

    # tier_name is the primary key: free | pro | elite | celeb
    tier_name: Mapped[str] = mapped_column(String(16), primary_key=True)
    max_active_classes: Mapped[int] = mapped_column(Integer, nullable=False)
    max_sessions_per_month: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
