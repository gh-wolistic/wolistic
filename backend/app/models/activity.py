from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PartnerActivity(Base):
    """Partner-created todo / task."""

    __tablename__ = "partner_activities"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # yet-to-start | in-progress | completed | rejected
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="yet-to-start")
    # low | medium | high
    priority: Mapped[str] = mapped_column(String(16), nullable=False, server_default="medium")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class WolisticActivityTemplate(Base):
    """Admin-configured platform suggestions shown to all (or specific) partners."""

    __tablename__ = "wolistic_activity_templates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Profile | Onboarding | Growth | Marketing
    category: Mapped[str] = mapped_column(String(64), nullable=False, server_default="Profile")
    # low | medium | high
    priority: Mapped[str] = mapped_column(String(16), nullable=False, server_default="medium")
    # null = show to all partner subtypes; otherwise filter by subtype
    applies_to_subtype: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class PartnerInternalActivityStatus(Base):
    """Per-partner status override for each WolisticActivityTemplate."""

    __tablename__ = "partner_internal_activity_statuses"
    __table_args__ = (
        UniqueConstraint(
            "professional_id",
            "template_id",
            name="uq_partner_internal_activity_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("wolistic_activity_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    # yet-to-start | in-progress | completed | rejected
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="yet-to-start")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
