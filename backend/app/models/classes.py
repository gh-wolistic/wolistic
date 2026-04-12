from __future__ import annotations

import uuid
from datetime import date, datetime, time

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time, func
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
    # Optional link to an expert_clients record
    expert_client_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("expert_clients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # confirmed | cancelled
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="confirmed")
    # paid | pending
    payment_status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
