"""
Business logic for professional verification system.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.professional import Professional
from app.models.user import User
from app.models.verification import (
    CredentialVerification,
    ProfessionalIdentityVerification,
    ProfessionLicenseRequirement,
)
from app.schemas.verification import (
    CredentialVerificationOut,
    CredentialVerificationSubmit,
    IdentityVerificationOut,
    IdentityVerificationSubmit,
    VerificationStatusOut,
)


class VerificationService:
    """Service for managing professional verification workflows."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ================================================================
    # Identity Verification
    # ================================================================
    
    async def submit_identity_verification(
        self,
        user_id: uuid.UUID,
        data: IdentityVerificationSubmit
    ) -> IdentityVerificationOut:
        """
        Submit or update identity verification for a professional.
        
        Business Rules:
        - If verification exists and is pending, update it
        - If verification exists and is approved, reject update (must contact admin)
        - If verification exists and is rejected, allow re-submission
        - New submissions get 7-day grace period
        """
        # Check if professional exists
        professional = await self.db.get(Professional, user_id)
        if not professional:
            raise ValueError("Professional not found")
        
        # Check existing verification
        stmt = select(ProfessionalIdentityVerification).where(
            ProfessionalIdentityVerification.user_id == user_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            # Don't allow updates to approved verifications
            if existing.verification_status == "approved":
                raise ValueError(
                    "Identity verification already approved. Contact support to update."
                )
            
            # Update existing pending/rejected verification
            existing.document_type = data.document_type
            existing.document_url = data.document_url
            existing.verification_status = "pending"
            existing.rejection_reason = None
            existing.submitted_at = datetime.now(timezone.utc)
            existing.grace_period_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            existing.updated_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            await self.db.refresh(existing)
            return IdentityVerificationOut.model_validate(existing)
        
        # Create new verification
        verification = ProfessionalIdentityVerification(
            user_id=user_id,
            document_type=data.document_type,
            document_url=data.document_url,
            verification_status="pending",
            grace_period_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            submitted_at=datetime.now(timezone.utc),
        )
        
        self.db.add(verification)
        await self.db.commit()
        await self.db.refresh(verification)
        
        return IdentityVerificationOut.model_validate(verification)
    
    async def get_identity_verification(
        self,
        user_id: uuid.UUID
    ) -> Optional[IdentityVerificationOut]:
        """Get identity verification status for a professional."""
        verification = await self.db.get(ProfessionalIdentityVerification, user_id)
        if not verification:
            return None
        return IdentityVerificationOut.model_validate(verification)
    
    # ================================================================
    # Credential Verification
    # ================================================================
    
    async def submit_credential_verification(
        self,
        user_id: uuid.UUID,
        data: CredentialVerificationSubmit
    ) -> CredentialVerificationOut:
        """
        Submit a new credential for verification.
        
        Business Rules:
        - Professionals can submit multiple credentials
        - Duplicate credentials (same name + issuer) are rejected
        - License-type credentials must have expiry_date
        """
        # Check if professional exists
        professional = await self.db.get(Professional, user_id)
        if not professional:
            raise ValueError("Professional not found")
        
        # Validate license requirements
        if data.credential_type == "license" and not data.expiry_date:
            raise ValueError("License credentials must have an expiry date")
        
        # Check for duplicates
        stmt = select(CredentialVerification).where(
            and_(
                CredentialVerification.professional_id == user_id,
                CredentialVerification.credential_type == data.credential_type,
                CredentialVerification.credential_name == data.credential_name,
                CredentialVerification.issuing_organization == data.issuing_organization,
                CredentialVerification.verification_status.in_(["pending", "approved"])
            )
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            raise ValueError(
                f"You already have a {data.credential_type} with this name from this organization"
            )
        
        # Create credential verification
        credential = CredentialVerification(
            professional_id=user_id,
            credential_type=data.credential_type,
            credential_subtype=data.credential_subtype,
            credential_name=data.credential_name,
            issuing_organization=data.issuing_organization,
            issued_date=data.issued_date,
            expiry_date=data.expiry_date,
            license_number=data.license_number,
            registry_link=data.registry_link,
            document_url=data.document_url,
            verification_status="pending",
            submitted_at=datetime.now(timezone.utc),
        )
        
        self.db.add(credential)
        await self.db.commit()
        await self.db.refresh(credential)
        
        return CredentialVerificationOut.model_validate(credential)
    
    async def get_credentials(
        self,
        user_id: uuid.UUID
    ) -> list[CredentialVerificationOut]:
        """Get all credentials for a professional."""
        stmt = select(CredentialVerification).where(
            CredentialVerification.professional_id == user_id
        ).order_by(CredentialVerification.submitted_at.desc())
        
        result = await self.db.execute(stmt)
        credentials = result.scalars().all()
        
        return [CredentialVerificationOut.model_validate(c) for c in credentials]
    
    # ================================================================
    # Combined Status
    # ================================================================
    
    async def get_verification_status(
        self,
        user_id: uuid.UUID
    ) -> VerificationStatusOut:
        """
        Get complete verification status with search visibility check.
        
        Search Visibility Rules:
        - Identity verified OR within 7-day grace period
        - If profession requires license, must have approved + non-expired license
        """
        # Get identity verification
        identity_verification = await self.get_identity_verification(user_id)
        
        # Get credentials
        credentials = await self.get_credentials(user_id)
        
        # Calculate summary
        identity_verified = (
            identity_verification is not None
            and identity_verification.verification_status == "approved"
        )
        
        approved_credentials = [
            c for c in credentials if c.verification_status == "approved"
        ]
        pending_credentials = [
            c for c in credentials if c.verification_status == "pending"
        ]
        
        # Check search visibility
        can_appear_in_search = True
        visibility_blockers = []
        
        # Rule 1: Identity verification
        if not identity_verification:
            can_appear_in_search = False
            visibility_blockers.append("No identity verification submitted")
        elif identity_verification.verification_status == "rejected":
            can_appear_in_search = False
            visibility_blockers.append("Identity verification rejected")
        elif identity_verification.verification_status == "pending":
            # Check grace period
            if identity_verification.grace_period_expires_at:
                if datetime.now(timezone.utc) > identity_verification.grace_period_expires_at:
                    can_appear_in_search = False
                    visibility_blockers.append("Identity verification grace period expired")
        
        # Rule 2: License compliance (check profession_type)
        professional = await self.db.get(Professional, user_id)
        if professional and professional.profession_type:
            # Check if profession requires license
            stmt = select(ProfessionLicenseRequirement).where(
                and_(
                    ProfessionLicenseRequirement.profession == professional.profession_type,
                    ProfessionLicenseRequirement.is_mandatory == True
                )
            )
            result = await self.db.execute(stmt)
            required_licenses = result.scalars().all()
            
            for req_license in required_licenses:
                # Check if professional has this license
                has_valid_license = any(
                    c.credential_subtype == req_license.credential_subtype
                    and c.verification_status == "approved"
                    and (c.expiry_date is None or c.expiry_date >= datetime.now(timezone.utc).date())
                    for c in credentials
                )
                
                if not has_valid_license:
                    can_appear_in_search = False
                    visibility_blockers.append(
                        f"Missing required license: {req_license.issuing_authority}"
                    )
        
        return VerificationStatusOut(
            identity_verification=identity_verification,
            credentials=credentials,
            identity_verified=identity_verified,
            credentials_count=len(credentials),
            approved_credentials_count=len(approved_credentials),
            pending_credentials_count=len(pending_credentials),
            is_searchable=can_appear_in_search,
            search_hide_reason="; ".join(visibility_blockers) if visibility_blockers else None,
        )
    
    # ================================================================
    # Admin Actions
    # ================================================================
    
    async def admin_approve_identity(
        self,
        user_id: uuid.UUID,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> IdentityVerificationOut:
        """Admin approves identity verification."""
        verification = await self.db.get(ProfessionalIdentityVerification, user_id)
        if not verification:
            raise ValueError("Identity verification not found")
        
        if verification.verification_status == "approved":
            raise ValueError("Identity verification already approved")
        
        verification.verification_status = "approved"
        verification.verified_at = datetime.now(timezone.utc)
        verification.verified_by_user_id = admin_user_id
        verification.rejection_reason = None
        verification.updated_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(verification)
        
        return IdentityVerificationOut.model_validate(verification)
    
    async def admin_reject_identity(
        self,
        user_id: uuid.UUID,
        admin_user_id: Optional[uuid.UUID] = None,
        rejection_reason: str = ""
    ) -> IdentityVerificationOut:
        """Admin rejects identity verification."""
        verification = await self.db.get(ProfessionalIdentityVerification, user_id)
        if not verification:
            raise ValueError("Identity verification not found")
        
        verification.verification_status = "rejected"
        verification.verified_at = datetime.now(timezone.utc)
        verification.verified_by_user_id = admin_user_id
        verification.rejection_reason = rejection_reason
        verification.updated_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(verification)
        
        return IdentityVerificationOut.model_validate(verification)
    
    async def admin_approve_credential(
        self,
        credential_id: int,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> CredentialVerificationOut:
        """Admin approves credential verification."""
        credential = await self.db.get(CredentialVerification, credential_id)
        if not credential:
            raise ValueError("Credential not found")
        
        if credential.verification_status == "approved":
            raise ValueError("Credential already approved")
        
        credential.verification_status = "approved"
        credential.verification_method = "manual"
        credential.verified_at = datetime.now(timezone.utc)
        credential.verified_by_user_id = admin_user_id
        credential.rejection_reason = None
        credential.updated_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(credential)
        
        return CredentialVerificationOut.model_validate(credential)
    
    async def admin_reject_credential(
        self,
        credential_id: int,
        admin_user_id: Optional[uuid.UUID] = None,
        rejection_reason: str = ""
    ) -> CredentialVerificationOut:
        """Admin rejects credential verification."""
        credential = await self.db.get(CredentialVerification, credential_id)
        if not credential:
            raise ValueError("Credential not found")
        
        credential.verification_status = "rejected"
        credential.verification_method = "manual"
        credential.verified_at = datetime.now(timezone.utc)
        credential.verified_by_user_id = admin_user_id
        credential.rejection_reason = rejection_reason
        credential.updated_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(credential)
        
        return CredentialVerificationOut.model_validate(credential)
