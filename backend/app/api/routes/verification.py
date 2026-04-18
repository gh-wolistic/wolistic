"""
Professional verification API routes.

Endpoints for professionals to submit identity and credential verification.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.schemas.verification import (
    CredentialVerificationOut,
    CredentialVerificationSubmit,
    IdentityVerificationOut,
    IdentityVerificationSubmit,
    UploadURLRequest,
    UploadURLResponse,
    VerificationStatusOut,
)
from app.services.verification import VerificationService
from app.services.verification_storage import VerificationStorageService
from app.core.supabase import get_supabase_client
from supabase import Client


router = APIRouter(prefix="/professionals/me/verification", tags=["professional-verification"])


# ================================================================
# Identity Verification
# ================================================================

@router.post(
    "/identity",
    response_model=IdentityVerificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit identity verification",
)
async def submit_identity_verification(
    data: IdentityVerificationSubmit,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Submit identity document for verification.
    
    **Flow:**
    1. Professional uploads document to Supabase Storage (using upload URL from /upload-url)
    2. Professional submits this endpoint with document_url
    3. Admin reviews in verification queue
    4. Professional notified of approval/rejection
    
    **Business Rules:**
    - Only one identity verification per professional
    - Can resubmit if rejected
    - Cannot update if already approved (contact support)
    - 7-day grace period to submit before search delisting
    """
    service = VerificationService(db)
    
    try:
        verification = await service.submit_identity_verification(
            user_id=current_user.user_id,
            data=data
        )
        return verification
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/identity",
    response_model=IdentityVerificationOut | None,
    summary="Get identity verification status",
)
async def get_identity_verification(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Get current identity verification status."""
    service = VerificationService(db)
    return await service.get_identity_verification(current_user.user_id)


# ================================================================
# Credential Verification
# ================================================================

@router.post(
    "/credentials",
    response_model=CredentialVerificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit credential verification",
)
async def submit_credential_verification(
    data: CredentialVerificationSubmit,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Submit education, certificate, or license for verification.
    
    **Credential Types:**
    - **education**: Academic degrees (BSc, MSc, PhD) - no expiry
    - **certificate**: Professional training (Yoga Alliance, NASM) - optional expiry
    - **license**: Legal permits (Medical Council, Dietitian Board) - mandatory expiry
    
    **Business Rules:**
    - Can submit multiple credentials
    - No duplicates (same name + issuer)
    - Licenses MUST have expiry_date
    - Expiring licenses (within 30 days) trigger email warnings
    
    **Tier Requirements:**
    - Free: No credential requirements
    - Pro: 1+ approved credential
    - Elite: 3+ approved credentials + 1 education
    """
    service = VerificationService(db)
    
    try:
        credential = await service.submit_credential_verification(
            user_id=current_user.user_id,
            data=data
        )
        return credential
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/credentials",
    response_model=list[CredentialVerificationOut],
    summary="List all credentials",
)
async def list_credentials(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Get all submitted credentials with verification status."""
    service = VerificationService(db)
    return await service.get_credentials(current_user.user_id)


# ================================================================
# Combined Status
# ================================================================

@router.get(
    "/status",
    response_model=VerificationStatusOut,
    summary="Get complete verification status",
)
async def get_verification_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Get complete verification status including search visibility.
    
    **Returns:**
    - Identity verification status
    - All credentials with status
    - Summary counts
    - **is_searchable**: Boolean flag indicating if professional appears in search
    - **search_hide_reason**: Reason why hidden (if any)
    
    **Search Visibility Rules:**
    1. Identity verified OR within 7-day grace period
    2. If profession requires license, must have approved + non-expired license
    
    **Example Response:**
    ```json
    {
      "identity_verified": true,
      "credentials_count": 3,
      "approved_credentials_count": 2,
      "is_searchable": false,
      "search_hide_reason": "Missing required license: Medical Council of India"
    }
    ```
    """
    service = VerificationService(db)
    return await service.get_verification_status(current_user.user_id)


# ================================================================
# Upload URL Generation
# ================================================================

@router.post(
    "/upload-url",
    response_model=UploadURLResponse,
    summary="Generate upload URL",
)
async def generate_upload_url(
    request: UploadURLRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_client: Client = Depends(get_supabase_client),
):
    """
    Generate a signed upload URL for direct Supabase Storage upload.
    
    **Upload Flow:**
    1. Call this endpoint to get file_path
    2. Upload file directly to Supabase Storage from frontend:
       ```typescript
       const { data, error } = await supabase.storage
         .from(uploadResponse.bucket)
         .upload(uploadResponse.file_path, file);
       ```
    3. Submit verification with file_path
    
    **Bucket Selection:**
    - `professional-identity-documents`: For Aadhaar, Passport, etc.
    - `professional-credentials`: For certificates, licenses, education
    
    **Allowed Extensions:** pdf, jpg, jpeg, png, webp
    **Max File Size:** 10MB
    """
    storage_service = VerificationStorageService(supabase_client)
    
    upload_data = storage_service.generate_upload_url(
        user_id=current_user.user_id,
        document_type="identity" if "identity" in request.bucket else "credential",
        file_extension=request.file_extension,
    )
    
    return UploadURLResponse(**upload_data)
