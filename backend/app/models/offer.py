from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Offer(Base):
    """
    Centralized offer/discount catalog supporting:
    - Tier upgrades (LAUNCH, CORPORATE-XXX)
    - Service-level discounts (future Phase 2)
    - Multi-channel attribution (admin, partnership, referral)
    """

    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    # Unique offer code (e.g., "LAUNCH", "CORPORATE-ACME")
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Offer type: tier_upgrade | tier_discount | service_discount
    offer_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    
    # Domain: subscription (tier-level) | booking (service-level)
    # Phase 1: subscription only; Phase 2: booking
    domain: Mapped[str] = mapped_column(String(32), nullable=False, server_default="subscription", index=True)
    
    # Tier upgrade fields (for offer_type='tier_upgrade')
    target_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)  # pro | elite
    duration_months: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 6
    auto_downgrade_after_months: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 6 (for LAUNCH)
    downgrade_to_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)  # free
    
    # Discount fields (for tier_discount | service_discount - future)
    discount_type: Mapped[str | None] = mapped_column(String(32), nullable=True)  # percentage | fixed
    discount_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Usage limits
    max_redemptions: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 100 for LAUNCH
    max_redemptions_per_professional: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    
    # Validity period
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Audit
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    
    # Relationships
    assignments: Mapped[list["OfferAssignment"]] = relationship(
        "OfferAssignment", 
        back_populates="offer",
        cascade="all, delete-orphan"
    )


class OfferAssignment(Base):
    """
    Ledger-based audit trail of offer assignments.
    Never delete - append-only for full audit history.
    """

    __tablename__ = "offer_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    # References
    offer_id: Mapped[int] = mapped_column(
        BigInteger, 
        ForeignKey("offers.id", ondelete="RESTRICT"), 
        nullable=False, 
        index=True
    )
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Status: pending | active | redeemed | expired | revoked
    # - pending: assigned but not activated yet
    # - active: currently in effect (subscription created)
    # - redeemed: successfully used (subscription completed)
    # - expired: validity period ended before activation
    # - revoked: manually cancelled by admin
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="pending", index=True)
    
    # Timestamps (ledger-based: never update, only create new rows)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Audit for revocations
    revoked_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    revoke_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    offer: Mapped["Offer"] = relationship("Offer", back_populates="assignments")
