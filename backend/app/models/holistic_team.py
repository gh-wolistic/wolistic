from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class HolisticTeam(Base):
    __tablename__ = "holistic_teams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False, default="engine_generated")
    scope: Mapped[str] = mapped_column(String(50), nullable=False, default="professionals")
    query_tag: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    pricing_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    pricing_currency: Mapped[str] = mapped_column(String(8), nullable=False, default="INR")
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="online")
    sessions_included_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    package_type: Mapped[str] = mapped_column(String(30), nullable=False, default="consultation_only")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    members: Mapped[list["HolisticTeamMember"]] = relationship(
        back_populates="team", cascade="all, delete-orphan", lazy="selectin"
    )


class HolisticTeamMember(Base):
    __tablename__ = "holistic_team_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("holistic_teams.id", ondelete="CASCADE"),
        nullable=False,
    )
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="other")
    sessions_included: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    team: Mapped[HolisticTeam] = relationship(back_populates="members")
    professional = relationship("Professional", lazy="joined")
