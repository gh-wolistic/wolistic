from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

_DEFAULT_NOTIFICATIONS = {
    "newBooking": {"email": True, "inApp": True},
    "sessionReminder": {"email": True, "inApp": True},
    "reviewReceived": {"email": True, "inApp": True},
    "followUpDue": {"email": True, "inApp": True},
    "paymentReceived": {"email": True, "inApp": False},
    "coinReward": {"email": False, "inApp": True},
    "platformTips": {"email": False, "inApp": False},
}

_DEFAULT_PRIVACY = {
    "profileVisible": True,
    "showInSearch": True,
    "allowMessages": True,
    "shareActivityData": False,
}


class ProfessionalSettings(Base):
    """Per-professional settings row (one per professional, created on first access)."""

    __tablename__ = "professional_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str] = mapped_column(
        String(100), nullable=False, server_default="Asia/Kolkata"
    )
    language: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default="EN"
    )
    notifications: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=_DEFAULT_NOTIFICATIONS
    )
    weekly_digest: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    privacy: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=_DEFAULT_PRIVACY
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
