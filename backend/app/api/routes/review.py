"""API routes for reviews, client list management, and expert responses."""

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.auth import get_current_user, get_optional_current_user, AuthenticatedUser
from app.services import review as review_service
from app.schemas.review import (
    ExpertClientCreateIn,
    ExpertClientOut,
    ReviewCreateIn,
    ReviewOut,
    ReviewsListOut,
    ReviewsSummaryOut,
    ReviewFlagIn,
    ReviewResponseCreateIn,
    ReviewResponseUpdateIn,
    ReviewResponseOut,
    ReviewEligibilityOut,
)

router = APIRouter(tags=["reviews"])


# ============================================================================
# Client List Management (Expert-only endpoints)
# ============================================================================

@router.post("/professionals/me/clients", response_model=ExpertClientOut, status_code=status.HTTP_201_CREATED)
async def add_client_to_my_list(
    client_data: ExpertClientCreateIn,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Add a client to expert's client list."""
    
    # TODO: Verify user is a professional
    professional_id = current_user.user_id
    
    try:
        client = await review_service.add_client_to_list(
            db=db,
            professional_id=professional_id,
            client_name=client_data.client_name,
            client_email=client_data.client_email,
            service_notes=client_data.service_notes,
        )
        
        return ExpertClientOut(
            id=client.id,
            professional_id=str(client.professional_id),
            client_user_id=str(client.user_id) if client.user_id else None,
            client_name=client.name,
            client_email=client.email,
            service_notes=client.notes,
            status=client.status,
            created_at=client.created_at,
            updated_at=client.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/professionals/me/clients", response_model=list[ExpertClientOut])
async def get_my_client_list(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get expert's client list."""
    
    professional_id = current_user.user_id
    
    clients = await review_service.get_expert_clients(
        db=db,
        professional_id=professional_id,
        limit=limit,
        offset=offset,
    )
    
    return [
        ExpertClientOut(
            id=client.id,
            professional_id=str(client.professional_id),
            client_user_id=str(client.user_id) if client.user_id else None,
            client_name=client.name,
            client_email=client.email,
            service_notes=client.notes,
            status=client.status,
            created_at=client.created_at,
            updated_at=client.updated_at,
        )
        for client in clients
    ]


@router.delete("/professionals/me/clients/{client_id}", status_code=status.HTTP_200_OK)
async def remove_client_from_my_list(
    client_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Remove a client from expert's client list."""
    
    professional_id = current_user.user_id
    
    success = await review_service.remove_client_from_list(
        db=db,
        professional_id=professional_id,
        client_id=client_id,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    return {"status": "deleted"}


# ============================================================================
# Review Eligibility & Submission
# ============================================================================

@router.get("/reviews/eligibility/{professional_id}", response_model=ReviewEligibilityOut)
async def check_review_eligibility_endpoint(
    professional_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
):
    """Check if current user can review the specified professional."""
    
    # If not authenticated, return cannot review with sign-in message
    if current_user is None:
        return ReviewEligibilityOut(
            can_review=False,
            reason="Please sign in to leave a review",
            verification_type=None,
        )
    
    user_id = current_user.user_id
    prof_id = uuid.UUID(professional_id)
    
    can_review, reason, verification_type = await review_service.check_review_eligibility(
        db=db,
        user_id=user_id,
        professional_id=prof_id,
    )
    
    return ReviewEligibilityOut(
        can_review=can_review,
        reason=reason,
        verification_type=verification_type,
    )


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review_endpoint(
    review_data: ReviewCreateIn,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new review."""
    
    user_id = current_user.user_id
    professional_id = uuid.UUID(review_data.professional_id)
    
    try:
        review = await review_service.create_review(
            db=db,
            user_id=user_id,
            professional_id=professional_id,
            rating=review_data.rating,
            review_text=review_data.review_text,
            booking_id=review_data.booking_id,
        )
        
        return ReviewOut(
            id=review.id,
            professional_id=str(review.professional_id),
            reviewer_user_id=str(review.reviewer_user_id),
            reviewer_name=review.reviewer.full_name if review.reviewer else None,
            reviewer_email=review.reviewer.email if review.reviewer else None,
            rating=review.rating,
            review_text=review.review_text,
            is_verified=review.is_verified,
            verification_type=review.verification_type,
            booking_id=review.booking_id,
            service_name=review.service_name,
            flagged_at=review.flagged_at,
            flagged_by_user_id=str(review.flagged_by_user_id) if review.flagged_by_user_id else None,
            flag_reason=review.flag_reason,
            moderation_status=review.moderation_status,
            created_at=review.created_at,
            response=None,  # New reviews don't have responses yet
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ============================================================================
# Review Display & Listing
# ============================================================================

@router.get("/professionals/{professional_id}/reviews", response_model=ReviewsListOut)
async def get_professional_reviews_endpoint(
    professional_id: str,
    filter: Literal["all", "verified", "wolistic_user"] = "all",
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
):
    """Get reviews for a professional."""
    
    prof_id = uuid.UUID(professional_id)
    
    # Get reviews
    reviews = await review_service.get_professional_reviews(
        db=db,
        professional_id=prof_id,
        filter_type=filter,
        limit=limit,
        offset=offset,
    )
    
    # Get summary
    summary = await review_service.get_reviews_summary(
        db=db,
        professional_id=prof_id,
    )
    
    reviews_out = [
        ReviewOut(
            id=review.id,
            professional_id=str(review.professional_id),
            reviewer_user_id=str(review.reviewer_user_id),
            reviewer_name=review.reviewer.full_name if review.reviewer else None,
            reviewer_email=review.reviewer.email if review.reviewer else None,
            rating=review.rating,
            review_text=review.review_text,
            is_verified=review.is_verified,
            verification_type=review.verification_type,
            booking_id=review.booking_id,
            service_name=review.service_name,
            flagged_at=review.flagged_at,
            flagged_by_user_id=str(review.flagged_by_user_id) if review.flagged_by_user_id else None,
            flag_reason=review.flag_reason,
            moderation_status=review.moderation_status,
            created_at=review.created_at,
            response=ReviewResponseOut(
                id=review.response.id,
                review_id=review.response.review_id,
                professional_id=str(review.response.professional_id),
                response_text=review.response.response_text,
                created_at=review.response.created_at,
                updated_at=review.response.updated_at,
            ) if review.response else None,
        )
        for review in reviews
    ]
    
    return ReviewsListOut(
        reviews=reviews_out,
        summary=ReviewsSummaryOut(**summary),
    )


# ============================================================================
# Review Flagging
# ============================================================================

@router.post("/reviews/{review_id}/flag", response_model=ReviewOut)
async def flag_review_endpoint(
    review_id: int,
    flag_data: ReviewFlagIn,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Flag a review for moderation."""
    
    user_id = current_user.user_id
    
    try:
        review = await review_service.flag_review(
            db=db,
            review_id=review_id,
            user_id=user_id,
            flag_reason=flag_data.flag_reason,
        )
        
        return ReviewOut(
            id=review.id,
            professional_id=str(review.professional_id),
            reviewer_user_id=str(review.reviewer_user_id),
            reviewer_name=None,
            reviewer_email=None,
            rating=review.rating,
            review_text=review.review_text,
            is_verified=review.is_verified,
            verification_type=review.verification_type,
            booking_id=review.booking_id,
            service_name=review.service_name,
            flagged_at=review.flagged_at,
            flagged_by_user_id=str(review.flagged_by_user_id) if review.flagged_by_user_id else None,
            flag_reason=review.flag_reason,
            moderation_status=review.moderation_status,
            created_at=review.created_at,
            response=None,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ============================================================================
# Expert Responses (Pro+ tier only)
# ============================================================================

@router.post("/reviews/{review_id}/respond", response_model=ReviewResponseOut, status_code=status.HTTP_201_CREATED)
async def create_review_response_endpoint(
    review_id: int,
    response_data: ReviewResponseCreateIn,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create an expert response to a review (Pro+ tier only)."""
    
    # TODO: Check user subscription tier is Pro or higher
    professional_id = current_user.user_id
    
    try:
        response = await review_service.create_review_response(
            db=db,
            review_id=review_id,
            professional_id=professional_id,
            response_text=response_data.response_text,
        )
        
        return ReviewResponseOut(
            id=response.id,
            review_id=response.review_id,
            professional_id=str(response.professional_id),
            response_text=response.response_text,
            created_at=response.created_at,
            updated_at=response.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/reviews/responses/{response_id}", response_model=ReviewResponseOut)
async def update_review_response_endpoint(
    response_id: int,
    response_data: ReviewResponseUpdateIn,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update an expert response."""
    
    professional_id = current_user.user_id
    
    try:
        response = await review_service.update_review_response(
            db=db,
            response_id=response_id,
            professional_id=professional_id,
            response_text=response_data.response_text,
        )
        
        return ReviewResponseOut(
            id=response.id,
            review_id=response.review_id,
            professional_id=str(response.professional_id),
            response_text=response.response_text,
            created_at=response.created_at,
            updated_at=response.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/reviews/responses/{response_id}", status_code=status.HTTP_200_OK)
async def delete_review_response_endpoint(
    response_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete an expert response."""
    
    professional_id = current_user.user_id
    
    success = await review_service.delete_review_response(
        db=db,
        response_id=response_id,
        professional_id=professional_id,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found",
        )
    
    return {"status": "deleted"}
