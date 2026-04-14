from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.professional import Professional
    from app.models.user import User


class ExpertClient(Base):
    """A client record owned by a professional (partner)."""

    __tablename__ = "expert_clients"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional link to a registered Wolistic user account
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Client profile (body expert specific)
    goals: Mapped[str | None] = mapped_column(Text)
    preferences: Mapped[str | None] = mapped_column(Text)
    medical_history: Mapped[str | None] = mapped_column(Text)
    dietary_requirements: Mapped[str | None] = mapped_column(Text)
    
    # Physical metrics (for body experts)
    age: Mapped[int | None] = mapped_column(Integer)
    height_cm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2))
    
    # Acquisition tracking
    acquisition_source: Mapped[str] = mapped_column(String(50), nullable=False, server_default="expert_invite")
    # Options: expert_invite, organic_search, corporate_event, wolistic_recommendation, wolistic_lead
    source_metadata: Mapped[dict | None] = mapped_column(JSON)
    
    # active | paused | archived
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="active")
    # null = no package, freeform name stored as-is
    package_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Session and engagement tracking
    total_sessions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    completed_sessions: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    attendance_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    current_streak_weeks: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    lifetime_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    
    last_session_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_session_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enrolled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
    # Relationships
    routines: Mapped[list["ExpertClientRoutine"]] = relationship("ExpertClientRoutine", back_populates="client", foreign_keys="ExpertClientRoutine.client_id")
    followups: Mapped[list["ExpertClientFollowUp"]] = relationship("ExpertClientFollowUp", back_populates="client")
    
    __table_args__ = (
        Index("ix_expert_clients_status", "status"),
        Index("ix_expert_clients_professional_status", "professional_id", "status"),
        CheckConstraint("status IN ('active', 'paused', 'archived')", name="ck_expert_clients_status"),
        CheckConstraint(
            "acquisition_source IN ('expert_invite', 'organic_search', 'corporate_event', 'wolistic_recommendation', 'wolistic_lead')",
            name="ck_expert_clients_acquisition_source"
        ),
    )


class ExpertClientFollowUp(Base):
    """Follow-up reminders created by a professional for a client."""

    __tablename__ = "expert_client_followups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("expert_clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
    # Relationships
    client: Mapped["ExpertClient"] = relationship("ExpertClient", back_populates="followups")
    
    __table_args__ = (
        Index("ix_expert_client_followups_due_date", "due_date"),
        Index("ix_expert_client_followups_resolved", "resolved"),
        Index("ix_expert_client_followups_professional_resolved", "professional_id", "resolved"),
    )


class ExpertLead(Base):
    """Prospect / lead tracked by a professional before they become a client."""

    __tablename__ = "expert_leads"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # platform | referral | direct
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="direct")
    interest: Mapped[str | None] = mapped_column(Text, nullable=True)
    # new | contacted | converted | dropped
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="new")
    enquiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ExpertClientRoutine(Base):
    """Routines/programs assigned to clients (can also be templates)."""

    __tablename__ = "expert_client_routines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("expert_clients.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # Nullable to support template routines (when is_template=True)

    # Routine details
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="draft")
    # Options: draft, under_review, approved, published, archived
    source_type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="manual")
    # Options: manual, ai_generated

    # Template support
    is_template: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    template_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("expert_client_routines.id", ondelete="SET NULL"),
        nullable=True,
    )
    # If assigned from a template, points to the source template

    # Timeline
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False, server_default="4")
    current_week: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    client: Mapped["ExpertClient | None"] = relationship("ExpertClient", back_populates="routines", foreign_keys=[client_id])
    items: Mapped[list["ExpertClientRoutineItem"]] = relationship("ExpertClientRoutineItem", back_populates="routine", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_expert_client_routines_is_template", "is_template"),
        Index("ix_expert_client_routines_status", "status"),
        Index("ix_expert_client_routines_professional_template", "professional_id", "is_template"),
        CheckConstraint("status IN ('draft', 'under_review', 'approved', 'published', 'archived')", name="ck_expert_client_routines_status"),
        CheckConstraint("source_type IN ('manual', 'ai_generated')", name="ck_expert_client_routines_source_type"),
    )


class ExpertClientRoutineItem(Base):
    """Individual items within a routine (exercises, hydration, mobility, etc)."""

    __tablename__ = "expert_client_routine_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    routine_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("expert_client_routines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Item details
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Options: exercise, hydration, mobility (body expert specific; meal/meditation handled by holistic teams)
    order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text)

    # Exercise-specific fields
    sets: Mapped[int | None] = mapped_column(Integer)
    reps: Mapped[int | None] = mapped_column(Integer)
    rest_seconds: Mapped[int | None] = mapped_column(Integer)
    intensity: Mapped[str | None] = mapped_column(String(20))
    # Options: light, moderate, intense

    # Meal-specific fields (for future holistic expansion)
    meal_type: Mapped[str | None] = mapped_column(String(20))
    # Options: breakfast, lunch, dinner, snack
    calories: Mapped[int | None] = mapped_column(Integer)

    # Check-in tracking
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    routine: Mapped["ExpertClientRoutine"] = relationship("ExpertClientRoutine", back_populates="items")

    __table_args__ = (
        Index("ix_expert_client_routine_items_type", "item_type"),
        Index("ix_expert_client_routine_items_routine_order", "routine_id", "order"),
        CheckConstraint("item_type IN ('exercise', 'hydration', 'mobility', 'meal')", name="ck_expert_client_routine_items_type"),
        CheckConstraint("intensity IN ('light', 'moderate', 'intense')", name="ck_expert_client_routine_items_intensity"),
    )
