"""
Verification models for professional identity and credential verification.
"""
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


# Enum types for credential verification
CREDENTIAL_TYPE_ENUM = ENUM(
    'education', 'certificate', 'license',
    name='credential_type',
    create_type=False  # Don't auto-create, managed by Alembic
)

CREDENTIAL_SUBTYPE_ENUM = ENUM(
    # Education subtypes
    'bachelors', 'masters', 'phd', 'diploma',
    # Certificate subtypes
    'yoga_certification', 'fitness_certification', 'nutrition_certification',
    'pilates_certification', 'meditation_certification',
    # License subtypes (regulated professions)
    'medical_council_license', 'dietitian_license', 'physiotherapy_license',
    'psychologist_license', 'nursing_license',
    name='credential_subtype',
    create_type=False
)


class ProfessionalIdentityVerification(Base):
    """
    Identity verification for professionals using government-issued ID.
    
    1:1 relationship with professionals table.
    Required for search visibility after grace period expires.
    """
    __tablename__ = "professional_identity_verification"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        primary_key=True
    )
    
    # Document details
    document_type: Mapped[str] = mapped_column(String(32), nullable=False)
    document_url: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Verification state
    verification_status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default="pending"
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    verified_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL")
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    
    # Grace period management
    grace_period_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    
    # Compliance: auto-delete document 30 days after approval
    document_deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    
    # Audit
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    professional: Mapped["Professional"] = relationship(
        "Professional",
        back_populates="identity_verification",
        lazy="joined"
    )
    verified_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[verified_by_user_id],
        lazy="noload"
    )


class CredentialVerification(Base):
    """
    Verification records for education, certificates, and licenses.
    
    1:many relationship with professionals table.
    Tracks verification status and expiry for time-bound credentials (licenses).
    """
    __tablename__ = "credential_verifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("professionals.user_id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Credential classification
    credential_type: Mapped[str] = mapped_column(CREDENTIAL_TYPE_ENUM, nullable=False)
    credential_subtype: Mapped[Optional[str]] = mapped_column(CREDENTIAL_SUBTYPE_ENUM)
    
    # Credential details
    credential_name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuing_organization: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Dates
    issued_date: Mapped[Optional[date]] = mapped_column(Date)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # License-specific fields
    license_number: Mapped[Optional[str]] = mapped_column(String(100))
    registry_link: Mapped[Optional[str]] = mapped_column(Text)
    
    # Verification evidence
    document_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Verification state
    verification_status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default="pending"
    )
    verification_method: Mapped[Optional[str]] = mapped_column(String(64))
    
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    verified_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL")
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    
    # License expiry tracking
    expiry_warning_sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    auto_expired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Audit
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    professional: Mapped["Professional"] = relationship(
        "Professional",
        back_populates="credential_verifications",
        lazy="joined"
    )
    verified_by: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[verified_by_user_id],
        lazy="noload"
    )


class ProfessionLicenseRequirement(Base):
    """
    Lookup table defining which professions require licenses.
    
    Used to enforce license compliance for regulated professions
    (doctors, dietitians, physiotherapists, psychologists, etc.)
    """
    __tablename__ = "profession_license_requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    profession: Mapped[str] = mapped_column(String(64), nullable=False)
    credential_subtype: Mapped[str] = mapped_column(CREDENTIAL_SUBTYPE_ENUM, nullable=False)
    issuing_authority: Mapped[str] = mapped_column(String(255), nullable=False)
    
    is_mandatory: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true"
    )
    registry_api_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false"
    )
    registry_api_endpoint: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
