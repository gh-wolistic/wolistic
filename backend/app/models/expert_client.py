"""Expert client management models."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class ExpertClient(Base):
    """Clients managed by wellness experts (professionals)."""

    __tablename__ = "expert_clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    professional_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Client profile
    goals: Mapped[str | None] = mapped_column(Text)
    preferences: Mapped[str | None] = mapped_column(Text)
    medical_history: Mapped[str | None] = mapped_column(Text)
    dietary_requirements: Mapped[str | None] = mapped_column(Text)

    # Physical metrics (for body experts)
    age: Mapped[int | None] = mapped_column(Integer)
    height_cm: Mapped[int | None] = mapped_column(Integer)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2))

    # Acquisition tracking
    acquisition_source: Mapped[str] = mapped_column(String(50), nullable=False, default="expert_invite")
    # Options: expert_invite, organic_search, corporate_event, wolistic_recommendation, wolistic_lead
    source_metadata: Mapped[dict | None] = mapped_column(JSON)

    # Status and engagement
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    # Options: active, paused, archived
    total_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    attendance_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_streak_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lifetime_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    # Timestamps
    enrolled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    professional: Mapped["User"] = relationship("User", foreign_keys=[professional_id], lazy="selectin")
    client_user: Mapped["User"] = relationship("User", foreign_keys=[client_user_id], lazy="selectin")
    routines: Mapped[list["ExpertClientRoutine"]] = relationship("ExpertClientRoutine", back_populates="client", cascade="all, delete-orphan")
    followups: Mapped[list["ExpertClientFollowup"]] = relationship("ExpertClientFollowup", back_populates="client", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_expert_clients_professional_id", "professional_id"),
        Index("ix_expert_clients_client_user_id", "client_user_id"),
        Index("ix_expert_clients_status", "status"),
        Index("ix_expert_clients_professional_status", "professional_id", "status"),
        CheckConstraint("status IN ('active', 'paused', 'archived')", name="ck_expert_clients_status"),
        CheckConstraint(
            "acquisition_source IN ('expert_invite', 'organic_search', 'corporate_event', 'wolistic_recommendation', 'wolistic_lead')",
            name="ck_expert_clients_acquisition_source"
        ),
    )


class ExpertClientRoutine(Base):
    """Routines/programs assigned to clients (can also be templates)."""

    __tablename__ = "expert_client_routines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    professional_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("expert_clients.id", ondelete="CASCADE"))
    # Nullable to support template routines (when is_template=True)

    # Routine details
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    # Options: draft, under_review, approved, published, archived
    source_type: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    # Options: manual, ai_generated

    # Template support
    is_template: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    template_id: Mapped[int | None] = mapped_column(ForeignKey("expert_client_routines.id", ondelete="SET NULL"))
    # If assigned from a template, points to the source template

    # Timeline
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    current_week: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    client: Mapped["ExpertClient | None"] = relationship("ExpertClient", back_populates="routines")
    items: Mapped[list["ExpertClientRoutineItem"]] = relationship("ExpertClientRoutineItem", back_populates="routine", cascade="all, delete-orphan")
    template: Mapped["ExpertClientRoutine | None"] = relationship("ExpertClientRoutine", remote_side=[id], lazy="selectin")

    __table_args__ = (
        Index("ix_expert_client_routines_professional_id", "professional_id"),
        Index("ix_expert_client_routines_client_id", "client_id"),
        Index("ix_expert_client_routines_is_template", "is_template"),
        Index("ix_expert_client_routines_status", "status"),
        CheckConstraint("status IN ('draft', 'under_review', 'approved', 'published', 'archived')", name="ck_expert_client_routines_status"),
        CheckConstraint("source_type IN ('manual', 'ai_generated')", name="ck_expert_client_routines_source_type"),
    )


class ExpertClientRoutineItem(Base):
    """Individual items within a routine (exercises, hydration, mobility, etc)."""

    __tablename__ = "expert_client_routine_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("expert_client_routines.id", ondelete="CASCADE"), nullable=False)

    # Item details
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Options: exercise, hydration, mobility (body expert specific; meal/meditation handled by holistic teams)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
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
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    routine: Mapped["ExpertClientRoutine"] = relationship("ExpertClientRoutine", back_populates="items")

    __table_args__ = (
        Index("ix_expert_client_routine_items_routine_id", "routine_id"),
        Index("ix_expert_client_routine_items_type", "item_type"),
        CheckConstraint("item_type IN ('exercise', 'hydration', 'mobility', 'meal')", name="ck_expert_client_routine_items_type"),
        CheckConstraint("intensity IN ('light', 'moderate', 'intense')", name="ck_expert_client_routine_items_intensity"),
    )


class ExpertClientFollowup(Base):
    """Follow-up tasks for client engagement."""

    __tablename__ = "expert_client_followups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    professional_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id: Mapped[int] = mapped_column(ForeignKey("expert_clients.id", ondelete="CASCADE"), nullable=False)

    note: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client: Mapped["ExpertClient"] = relationship("ExpertClient", back_populates="followups")

    __table_args__ = (
        Index("ix_expert_client_followups_professional_id", "professional_id"),
        Index("ix_expert_client_followups_client_id", "client_id"),
        Index("ix_expert_client_followups_due_date", "due_date"),
        Index("ix_expert_client_followups_resolved", "resolved"),
        Index("ix_expert_client_followups_professional_resolved", "professional_id", "resolved"),
    )
