"""
Pydantic schemas for professional verification system.
"""
from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ================================================================
# Identity Verification Schemas
# ================================================================

class IdentityVerificationSubmit(BaseModel):
    """Request schema for submitting identity verification."""
    document_type: Literal["aadhaar", "passport", "drivers_license", "pan_card"]
    document_url: str = Field(..., description="File path in Supabase Storage (user_id/filename.ext)")
    
    @field_validator("document_url")
    @classmethod
    def validate_document_url(cls, v: str) -> str:
        if not v or v == "":
            raise ValueError("document_url cannot be empty")
        return v


class IdentityVerificationOut(BaseModel):
    """Response schema for identity verification status."""
    user_id: UUID
    document_type: str
    verification_status: Literal["pending", "approved", "rejected"]
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    grace_period_expires_at: Optional[datetime] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ================================================================
# Credential Verification Schemas
# ================================================================

class CredentialVerificationSubmit(BaseModel):
    """Request schema for submitting a credential for verification."""
    credential_type: Literal["education", "certificate", "license"]
    credential_subtype: Optional[Literal[
        # Education
        "bachelors", "masters", "phd", "diploma",
        # Certificates
        "yoga_certification", "fitness_certification", "nutrition_certification",
        "pilates_certification", "meditation_certification",
        # Licenses
        "medical_council_license", "dietitian_license", "physiotherapy_license",
        "psychologist_license", "nursing_license"
    ]] = None
    credential_name: str = Field(..., min_length=1, max_length=255)
    issuing_organization: str = Field(..., min_length=1, max_length=255)
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    license_number: Optional[str] = Field(None, max_length=100)
    registry_link: Optional[str] = None
    document_url: Optional[str] = Field(None, description="File path in Supabase Storage")
    
    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_after_issued(cls, v: Optional[date], info) -> Optional[date]:
        if v and info.data.get("issued_date") and v < info.data["issued_date"]:
            raise ValueError("expiry_date must be after issued_date")
        return v


class CredentialVerificationOut(BaseModel):
    """Response schema for credential verification."""
    id: int
    professional_id: UUID
    credential_type: str
    credential_subtype: Optional[str] = None
    credential_name: str
    issuing_organization: str
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    license_number: Optional[str] = None
    registry_link: Optional[str] = None
    verification_status: Literal["pending", "approved", "rejected", "expired", "auto_verified"]
    verification_method: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ================================================================
# Verification Status (Combined View)
# ================================================================

class VerificationStatusOut(BaseModel):
    """Combined verification status for a professional."""
    identity_verification: Optional[IdentityVerificationOut] = None
    credentials: list[CredentialVerificationOut] = []
    
    # Summary flags
    identity_verified: bool = False
    credentials_count: int = 0
    approved_credentials_count: int = 0
    pending_credentials_count: int = 0
    
    # Search visibility status
    can_appear_in_search: bool = False
    visibility_blockers: list[str] = []  # Reasons why professional is hidden


# ================================================================
# Upload URL Generation
# ================================================================

class UploadURLRequest(BaseModel):
    """Request to generate a signed upload URL."""
    bucket: Literal["professional-identity-documents", "professional-credentials"]
    file_extension: str = Field(..., pattern=r"^(pdf|jpg|jpeg|png|webp)$")


class UploadURLResponse(BaseModel):
    """Signed upload URL for direct Supabase Storage upload."""
    bucket: str
    file_path: str
    expires_at: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "bucket": "professional-identity-documents",
                "file_path": "550e8400-e29b-41d4-a716-446655440000/20260418_153045_a1b2c3d4.pdf",
                "expires_at": "2026-04-18T16:30:45Z"
            }
        }


# ================================================================
# Admin Verification Actions
# ================================================================

class AdminVerificationApprove(BaseModel):
    """Admin action to approve a verification."""
    notes: Optional[str] = Field(None, max_length=1000, description="Internal notes (not shown to professional)")


class AdminVerificationReject(BaseModel):
    """Admin action to reject a verification."""
    rejection_reason: str = Field(..., min_length=10, max_length=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "rejection_reason": "The uploaded document is not clear. Please upload a high-quality scan or photo where all text is readable."
            }
        }


# ================================================================
# Admin Verification Queue
# ================================================================

class ProfessionalVerificationQueueItem(BaseModel):
    """Single item in admin verification queue."""
    verification_id: int | UUID  # int for credentials, UUID for identity
    verification_type: Literal["identity", "credential"]
    professional_id: UUID
    professional_username: str
    professional_name: str
    
    # Verification details
    document_type: Optional[str] = None  # For identity
    credential_type: Optional[str] = None  # For credentials
    credential_name: Optional[str] = None
    issuing_organization: Optional[str] = None
    
    verification_status: str
    submitted_at: datetime
    days_pending: int
    
    class Config:
        from_attributes = True


class VerificationQueueResponse(BaseModel):
    """Admin verification queue with pagination."""
    items: list[ProfessionalVerificationQueueItem]
    total_count: int
    pending_identity_count: int
    pending_credential_count: int
    expiring_licenses_count: int
