"""
Admin verification API routes.

Endpoints for admin to review and approve/reject verification submissions.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.models.verification import (
    CredentialVerification,
    ProfessionalIdentityVerification,
)
from app.schemas.verification import (
    AdminVerificationApprove,
    AdminVerificationReject,
    CredentialVerificationOut,
    IdentityVerificationOut,
    ProfessionalVerificationQueueItem,
    VerificationQueueResponse,
)
from app.services.verification import VerificationService
from app.services.verification_storage import VerificationStorageService
from app.core.supabase import get_supabase_client


# System admin UUID for API key authenticated requests
SYSTEM_ADMIN_UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def require_admin_api_key(
    x_admin_key: str = Header(None, alias="X-Admin-Key")
):
    """Validate admin API key for verification endpoints."""
    expected_key = os.getenv("ADMIN_API_KEY", "MochaMaple@26")
    if not x_admin_key or x_admin_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin API key"
        )
    return x_admin_key


router = APIRouter(
    prefix="/admin/verification",
    tags=["admin-verification"],
    dependencies=[Depends(require_admin_api_key)],
)


# ================================================================
# Verification Queue
# ================================================================

@router.get(
    "/queue",
    response_model=VerificationQueueResponse,
    summary="Get verification queue",
)
async def get_verification_queue(
    queue_type: Optional[Literal["identity", "credential", "expiring_licenses"]] = Query(
        None,
        description="Filter by verification type"
    ),
    status_filter: Optional[Literal["pending", "approved", "rejected"]] = Query(
        "pending",
        description="Filter by verification status"
    ),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Get verification queue for admin review.
    
    **Queue Types:**
    - `identity`: Identity document verifications
    - `credential`: Education/certificate/license verifications
    - `expiring_licenses`: Licenses expiring within 30 days
    - `null`: All types (default)
    
    **Returns:**
    - Paginated list of pending verifications
    - Summary counts for dashboard
    - Professional details for each item
    """
    items = []
    
    # Query identity verifications
    if queue_type in [None, "identity"]:
        identity_stmt = (
            select(
                ProfessionalIdentityVerification,
                Professional,
                User
            )
            .join(Professional, Professional.user_id == ProfessionalIdentityVerification.user_id)
            .join(User, User.id == Professional.user_id)
            .where(ProfessionalIdentityVerification.verification_status == status_filter)
            .order_by(ProfessionalIdentityVerification.submitted_at.asc())
        )
        
        if queue_type == "identity":
            identity_stmt = identity_stmt.limit(limit).offset(offset)
        
        result = await db.execute(identity_stmt)
        identity_rows = result.all()
        
        for verification, professional, user in identity_rows:
            days_pending = (datetime.now(timezone.utc) - verification.submitted_at).days
            items.append(
                ProfessionalVerificationQueueItem(
                    verification_id=verification.user_id,
                    verification_type="identity",
                    professional_id=professional.user_id,
                    professional_username=professional.username,
                    professional_name=user.full_name or "Unknown",
                    document_type=verification.document_type,
                    document_url=verification.document_url,
                    verification_status=verification.verification_status,
                    submitted_at=verification.submitted_at,
                    days_pending=days_pending,
                )
            )
    
    # Query credential verifications
    if queue_type in [None, "credential"]:
        credential_stmt = (
            select(
                CredentialVerification,
                Professional,
                User
            )
            .join(Professional, Professional.user_id == CredentialVerification.professional_id)
            .join(User, User.id == Professional.user_id)
            .where(CredentialVerification.verification_status == status_filter)
            .order_by(CredentialVerification.submitted_at.asc())
        )
        
        if queue_type == "credential":
            credential_stmt = credential_stmt.limit(limit).offset(offset)
        
        result = await db.execute(credential_stmt)
        credential_rows = result.all()
        
        for verification, professional, user in credential_rows:
            days_pending = (datetime.now(timezone.utc) - verification.submitted_at).days
            items.append(
                ProfessionalVerificationQueueItem(
                    verification_id=verification.id,
                    verification_type="credential",
                    professional_id=professional.user_id,
                    professional_username=professional.username,
                    professional_name=user.full_name or "Unknown",
                    credential_type=verification.credential_type,
                    credential_name=verification.credential_name,
                    issuing_organization=verification.issuing_organization,
                    document_url=verification.document_url,
                    verification_status=verification.verification_status,
                    submitted_at=verification.submitted_at,
                    days_pending=days_pending,
                )
            )
    
    # Query expiring licenses
    if queue_type == "expiring_licenses":
        expiry_threshold = datetime.now(timezone.utc).date() + timedelta(days=30)
        expiring_stmt = (
            select(
                CredentialVerification,
                Professional,
                User
            )
            .join(Professional, Professional.user_id == CredentialVerification.professional_id)
            .join(User, User.id == Professional.user_id)
            .where(
                and_(
                    CredentialVerification.credential_type == "license",
                    CredentialVerification.verification_status == "approved",
                    CredentialVerification.expiry_date <= expiry_threshold,
                    CredentialVerification.expiry_date >= datetime.now(timezone.utc).date()
                )
            )
            .order_by(CredentialVerification.expiry_date.asc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await db.execute(expiring_stmt)
        expiring_rows = result.all()
        
        for verification, professional, user in expiring_rows:
            days_pending = 0  # Not applicable for expiring licenses
            items.append(
                ProfessionalVerificationQueueItem(
                    verification_id=verification.id,
                    verification_type="credential",
                    professional_id=professional.user_id,
                    professional_username=professional.username,
                    professional_name=user.full_name or "Unknown",
                    credential_type=verification.credential_type,
                    credential_name=verification.credential_name,
                    issuing_organization=verification.issuing_organization,
                    document_url=verification.document_url,
                    verification_status=verification.verification_status,
                    submitted_at=verification.submitted_at,
                    days_pending=days_pending,
                )
            )
    
    # Get summary counts
    pending_identity_count_stmt = select(func.count()).select_from(ProfessionalIdentityVerification).where(
        ProfessionalIdentityVerification.verification_status == "pending"
    )
    pending_identity_result = await db.execute(pending_identity_count_stmt)
    pending_identity_count = pending_identity_result.scalar() or 0
    
    pending_credential_count_stmt = select(func.count()).select_from(CredentialVerification).where(
        CredentialVerification.verification_status == "pending"
    )
    pending_credential_result = await db.execute(pending_credential_count_stmt)
    pending_credential_count = pending_credential_result.scalar() or 0
    
    expiry_threshold = datetime.now(timezone.utc).date() + timedelta(days=30)
    expiring_licenses_stmt = select(func.count()).select_from(CredentialVerification).where(
        and_(
            CredentialVerification.credential_type == "license",
            CredentialVerification.verification_status == "approved",
            CredentialVerification.expiry_date <= expiry_threshold,
            CredentialVerification.expiry_date >= datetime.now(timezone.utc).date()
        )
    )
    expiring_licenses_result = await db.execute(expiring_licenses_stmt)
    expiring_licenses_count = expiring_licenses_result.scalar() or 0
    
    return VerificationQueueResponse(
        items=items[:limit],  # Apply limit if we fetched multiple types
        total_count=len(items),
        pending_identity_count=pending_identity_count,
        pending_credential_count=pending_credential_count,
        expiring_licenses_count=expiring_licenses_count,
    )


@router.get(
    "/document-url",
    summary="Get signed URL for document preview",
)
async def get_document_signed_url(
    document_path: str = Query(..., description="Document path in storage"),
    bucket_type: Literal["identity", "credential"] = Query(..., description="Bucket type"),
):
    """
    Generate a temporary signed URL for viewing verification documents.
    
    **Admin Only**: Used for document preview in verification queue.
    
    Args:
        document_path: File path in storage (e.g., "user_id/document.pdf")
        bucket_type: "identity" or "credential"
    
    Returns:
        {"signed_url": "https://..."}
    """
    supabase = get_supabase_client()
    storage_service = VerificationStorageService(supabase)
    
    try:
        signed_url = storage_service.get_signed_download_url(
            document_url=document_path,
            bucket_type=bucket_type,
            expires_in_seconds=3600  # 1 hour
        )
        return {"signed_url": signed_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signed URL: {str(e)}"
        )


# ================================================================
# Identity Verification Actions
# ================================================================

@router.post(
    "/identity/{user_id}/approve",
    response_model=IdentityVerificationOut,
    summary="Approve identity verification",
)
async def approve_identity_verification(
    user_id: uuid.UUID,
    data: AdminVerificationApprove,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Approve a professional's identity verification.
    
    **Actions Triggered:**
    - Verification status → approved
    - Grace period cleared
    - Professional can appear in search
    - Document scheduled for auto-deletion in 30 days (compliance)
    """
    service = VerificationService(db)
    
    try:
        verification = await service.admin_approve_identity(
            user_id=user_id,
            admin_user_id=None  # API key authenticated
        )
        return verification
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/identity/{user_id}/reject",
    response_model=IdentityVerificationOut,
    summary="Reject identity verification",
)
async def reject_identity_verification(
    user_id: uuid.UUID,
    data: AdminVerificationReject,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Reject a professional's identity verification.
    
    **Actions Triggered:**
    - Verification status → rejected
    - Professional notified with rejection_reason
    - Professional can resubmit with new document
    - Professional hidden from search until resubmission approved
    """
    service = VerificationService(db)
    
    try:
        verification = await service.admin_reject_identity(
            user_id=user_id,
            admin_user_id=None,  # API key authenticated
            rejection_reason=data.rejection_reason
        )
        return verification
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ================================================================
# Credential Verification Actions
# ================================================================

@router.post(
    "/credential/{credential_id}/approve",
    response_model=CredentialVerificationOut,
    summary="Approve credential verification",
)
async def approve_credential_verification(
    credential_id: int,
    data: AdminVerificationApprove,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Approve a credential verification.
    
    **Actions Triggered:**
    - Verification status → approved
    - Verification method → manual
    - Credential counts toward tier requirements
    - If license with expiry, schedule expiry warnings
    """
    service = VerificationService(db)
    
    try:
        credential = await service.admin_approve_credential(
            credential_id=credential_id,
            admin_user_id=None  # API key authenticated
        )
        return credential
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/credential/{credential_id}/reject",
    response_model=CredentialVerificationOut,
    summary="Reject credential verification",
)
async def reject_credential_verification(
    credential_id: int,
    data: AdminVerificationReject,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Reject a credential verification.
    
    **Actions Triggered:**
    - Verification status → rejected
    - Professional notified with rejection_reason
    - Professional can submit a new credential
    - Does not count toward tier requirements
    """
    service = VerificationService(db)
    
    try:
        credential = await service.admin_reject_credential(
            credential_id=credential_id,
            admin_user_id=None,  # API key authenticated
            rejection_reason=data.rejection_reason
        )
        return credential
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
