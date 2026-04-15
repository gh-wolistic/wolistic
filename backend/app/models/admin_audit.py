"""Admin Audit Log model for tracking all administrative actions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AdminAuditLog(Base):
    """
    Immutable log of all admin actions for compliance and forensics.
    
    Records every modification made through the admin panel including:
    - Professional status changes (approve, suspend)
    - Tier upgrades/downgrades
    - Offer assignments and activations
    - Coin rule modifications
    - Bulk operations
    
    This table is append-only and should never be updated or deleted.
    Supports HIPAA/GDPR compliance and dispute resolution.
    """

    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    
    # Action metadata
    action: Mapped[str] = mapped_column(
        String(100), 
        nullable=False,
        comment="Action performed (e.g., 'approve_professional', 'update_tier')"
    )
    resource_type: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        comment="Type of resource affected (e.g., 'professional', 'offer', 'coin_rule')"
    )
    resource_id: Mapped[str] = mapped_column(
        String(255), 
        nullable=False,
        comment="ID of the affected resource"
    )
    
    # Admin identification
    admin_email: Mapped[str] = mapped_column(
        String(255), 
        nullable=False,
        comment="Email of admin who performed the action"
    )
    
    # Request metadata
    request_method: Mapped[str] = mapped_column(
        String(10), 
        nullable=False,
        comment="HTTP method (POST, PATCH, DELETE)"
    )
    request_path: Mapped[str] = mapped_column(
        Text, 
        nullable=False,
        comment="Full request path"
    )
    
    # Action details
    payload: Mapped[dict | None] = mapped_column(
        JSONB, 
        nullable=True,
        comment="Request body or relevant action parameters (JSON)"
    )
    
    # Security metadata
    client_ip: Mapped[str | None] = mapped_column(
        String(45), 
        nullable=True,
        comment="IP address of client (IPv4 or IPv6)"
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(500), 
        nullable=True,
        comment="Browser user agent string"
    )
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="When the action was performed"
    )

    def __repr__(self) -> str:
        return (
            f"<AdminAuditLog(id={self.id}, "
            f"action='{self.action}', "
            f"resource_type='{self.resource_type}', "
            f"resource_id='{self.resource_id}', "
            f"admin='{self.admin_email}', "
            f"created_at='{self.created_at}')>"
        )
