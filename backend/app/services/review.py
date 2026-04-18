"""Service layer for reviews and client list management."""

import uuid
from datetime import datetime
from typing import Literal

from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.client import ExpertClient
from app.models.professional import Professional, ProfessionalReview, ProfessionalReviewResponse
from app.models.booking import Booking
from app.models.user import User
from app.services import notification as notification_service


# ============================================================================
# Client List Management
# ============================================================================

async def add_client_to_list(
    db: AsyncSession,
    professional_id: uuid.UUID,
    client_name: str,
    client_email: str,
    service_notes: str | None = None,
) -> ExpertClient:
    """Add a client to expert's client list."""
    
    # Check if user already exists with this email
    result = await db.execute(select(User).where(User.email == client_email))
    existing_user = result.scalar_one_or_none()
    
    # Create client record
    client = ExpertClient(
        professional_id=professional_id,
        client_user_id=existing_user.id if existing_user else None,
        name=client_name,
        email=client_email,
        notes=service_notes,
        status="registered" if existing_user else "pending",
    )
    
    db.add(client)
    await db.commit()
    await db.refresh(client)
    
    return client


async def get_expert_clients(
    db: AsyncSession,
    professional_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[ExpertClient]:
    """Get expert's client list."""
    result = await db.execute(
        select(ExpertClient)
        .where(ExpertClient.professional_id == professional_id)
        .order_by(ExpertClient.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def remove_client_from_list(
    db: AsyncSession,
    professional_id: uuid.UUID,
    client_id: int,
) -> bool:
    """Remove a client from expert's client list."""
    result = await db.execute(
        select(ExpertClient).where(
            and_(
                ExpertClient.id == client_id,
                ExpertClient.professional_id == professional_id,
            )
        )
    )
    client = result.scalar_one_or_none()
    
    if not client:
        return False
    
    await db.delete(client)
    await db.commit()
    return True


# ============================================================================
# Review Eligibility & Submission
# ============================================================================

async def check_review_eligibility(
    db: AsyncSession,
    user_id: uuid.UUID,
    professional_id: uuid.UUID,
) -> tuple[bool, str | None, Literal["verified_client", "wolistic_user"] | None]:
    """
    Check if user can review the professional.
    
    Returns:
        (can_review, reason, verification_type)
    """
    
    # Check if user has already reviewed this professional
    existing_review = await db.execute(
        select(ProfessionalReview).where(
            and_(
                ProfessionalReview.professional_id == professional_id,
                ProfessionalReview.reviewer_user_id == user_id,
            )
        )
    )
    if existing_review.scalar_one_or_none():
        return (False, "You have already reviewed this professional", None)
    
    # Check if user has completed booking (verified client)
    booking_result = await db.execute(
        select(Booking)
        .where(
            and_(
                Booking.professional_id == professional_id,
                Booking.client_user_id == user_id,
                Booking.status == "confirmed",
            )
        )
        .limit(1)
    )
    completed_booking = booking_result.scalar_one_or_none()
    
    if completed_booking:
        return (True, None, "verified_client")
    
    # Check if user is in expert's client list (wolistic user)
    client_list_result = await db.execute(
        select(ExpertClient).where(
            and_(
                ExpertClient.professional_id == professional_id,
                ExpertClient.user_id == user_id,
            )
        )
    )
    in_client_list = client_list_result.scalar_one_or_none()
    
    if in_client_list:
        return (True, None, "wolistic_user")
    
    return (
        False, 
        "To leave a review, you must complete a booking with this professional or be added to their client list",
        None,
    )


async def create_review(
    db: AsyncSession,
    user_id: uuid.UUID,
    professional_id: uuid.UUID,
    rating: int,
    review_text: str | None = None,
    booking_id: int | None = None,
) -> ProfessionalReview:
    """Create a new review."""
    
    # Get verification type
    can_review, reason, verification_type = await check_review_eligibility(
        db, user_id, professional_id
    )
    
    if not can_review:
        raise ValueError(reason or "Not authorized to review")
    
    # Get service name if booking provided
    service_name = None
    if booking_id:
        booking_result = await db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = booking_result.scalar_one_or_none()
        if booking:
            service_name = booking.service_name or "Service"
    else:
        # Try to get service notes from client list
        client_result = await db.execute(
            select(ExpertClient).where(
                and_(
                    ExpertClient.professional_id == professional_id,
                    ExpertClient.user_id == user_id,
                )
            )
        )
        client= client_result.scalar_one_or_none()
        if client and client.notes:
            service_name = client.notes[:255]  # Truncate to fit
    
    # Create review
    review = ProfessionalReview(
        professional_id=professional_id,
        reviewer_user_id=user_id,
        rating=rating,
        review_text=review_text,
        is_verified=(verification_type == "verified_client"),
        verification_type=verification_type,
        booking_id=booking_id,
        service_name=service_name,
    )
    
    db.add(review)
    await db.commit()
    await db.refresh(review, ["reviewer"])
    
    # Update client status if they were in pending list
    if verification_type == "wolistic_user":
        await db.execute(
            select(ExpertClient)
            .where(
                and_(
                    ExpertClient.professional_id == professional_id,
                    ExpertClient.user_id == user_id,
                )
            )
            .limit(1)
        )
        # Update status to 'reviewed'
        result = await db.execute(
            select(ExpertClient).where(
                and_(
                    ExpertClient.professional_id == professional_id,
                    ExpertClient.user_id == user_id,
                )
            )
        )
        client_record = result.scalar_one_or_none()
        if client_record:
            client_record.status = "reviewed"
            await db.commit()
    
    # Sync Professional.rating_avg / rating_count
    await _sync_professional_rating(db, professional_id)
    
    # Notify professional about new review
    reviewer_name = review.reviewer.full_name if review.reviewer else "A client"
    stars = "⭐" * rating
    
    await notification_service.create_notification(
        db,
        user_id=professional_id,
        type="system",
        title=f"⭐ New {rating}-Star Review!",
        description=f"{reviewer_name} left you a review: {review_text[:100] if review_text else stars}",
        action_url="/v2/partner/body-expert",
        action_text="View Review",
        extra_data={
            "review_id": review.id,
            "rating": rating,
            "reviewer_name": reviewer_name
        }
    )

    return review


async def _sync_professional_rating(db: AsyncSession, professional_id: uuid.UUID) -> None:
    """Recalculate and persist rating_avg + rating_count on the Professional row."""
    result = await db.execute(
        select(
            func.count(ProfessionalReview.id).label("total"),
            func.avg(ProfessionalReview.rating).label("avg"),
        ).where(
            and_(
                ProfessionalReview.professional_id == professional_id,
                or_(
                    ProfessionalReview.moderation_status.is_(None),
                    ProfessionalReview.moderation_status != "removed",
                ),
            )
        )
    )
    row = result.one()
    total = row.total or 0
    avg = round(float(row.avg or 0.0), 1)

    prof_result = await db.execute(
        select(Professional).where(Professional.user_id == professional_id)
    )
    prof = prof_result.scalar_one_or_none()
    if prof:
        prof.rating_avg = avg
        prof.rating_count = total
        await db.commit()


async def get_professional_reviews(
    db: AsyncSession,
    professional_id: uuid.UUID,
    filter_type: Literal["all", "verified", "wolistic_user"] | None = "all",
    limit: int = 50,
    offset: int = 0,
) -> list[ProfessionalReview]:
    """Get reviews for a professional with optional filtering."""
    
    query = (
        select(ProfessionalReview)
        .where(ProfessionalReview.professional_id == professional_id)
        .options(selectinload(ProfessionalReview.reviewer))
        .options(selectinload(ProfessionalReview.response))
    )
    
    # Filter by verification type
    if filter_type == "verified":
        query = query.where(ProfessionalReview.verification_type == "verified_client")
    elif filter_type == "wolistic_user":
        query = query.where(ProfessionalReview.verification_type == "wolistic_user")
    
    # Exclude removed reviews
    query = query.where(
        or_(
            ProfessionalReview.moderation_status.is_(None),
            ProfessionalReview.moderation_status != "removed",
        )
    )
    
    query = query.order_by(ProfessionalReview.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_reviews_summary(
    db: AsyncSession,
    professional_id: uuid.UUID,
) -> dict:
    """Get summary statistics for professional's reviews."""
    
    # Total count and average rating
    result = await db.execute(
        select(
            func.count(ProfessionalReview.id).label("total"),
            func.avg(ProfessionalReview.rating).label("avg_rating"),
        )
        .where(
            and_(
                ProfessionalReview.professional_id == professional_id,
                or_(
                    ProfessionalReview.moderation_status.is_(None),
                    ProfessionalReview.moderation_status != "removed",
                ),
            )
        )
    )
    row = result.one()
    total_reviews = row.total or 0
    avg_rating = float(row.avg_rating or 0.0)
    
    # Count by verification type
    verified_result = await db.execute(
        select(func.count(ProfessionalReview.id))
        .where(
            and_(
                ProfessionalReview.professional_id == professional_id,
                ProfessionalReview.verification_type == "verified_client",
                or_(
                    ProfessionalReview.moderation_status.is_(None),
                    ProfessionalReview.moderation_status != "removed",
                ),
            )
        )
    )
    verified_count = verified_result.scalar() or 0
    
    wolistic_result = await db.execute(
        select(func.count(ProfessionalReview.id))
        .where(
            and_(
                ProfessionalReview.professional_id == professional_id,
                ProfessionalReview.verification_type == "wolistic_user",
                or_(
                    ProfessionalReview.moderation_status.is_(None),
                    ProfessionalReview.moderation_status != "removed",
                ),
            )
        )
    )
    wolistic_user_count = wolistic_result.scalar() or 0
    
    # Response rate
    responded_result = await db.execute(
        select(func.count(ProfessionalReview.id))
        .join(ProfessionalReviewResponse, ProfessionalReviewResponse.review_id == ProfessionalReview.id)
        .where(ProfessionalReview.professional_id == professional_id)
    )
    responded_count = responded_result.scalar() or 0
    response_rate = (responded_count / total_reviews * 100) if total_reviews > 0 else 0.0
    
    return {
        "total_reviews": total_reviews,
        "avg_rating": round(avg_rating, 1),
        "verified_count": verified_count,
        "wolistic_user_count": wolistic_user_count,
        "response_rate": round(response_rate, 1),
    }


# ============================================================================
# Review Flagging & Moderation
# ============================================================================

async def flag_review(
    db: AsyncSession,
    review_id: int,
    user_id: uuid.UUID,
    flag_reason: str,
) -> ProfessionalReview:
    """Flag a review for moderation."""
    
    result = await db.execute(
        select(ProfessionalReview).where(ProfessionalReview.id == review_id)
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise ValueError("Review not found")
    
    if review.moderation_status == "under_review":
        raise ValueError("Review is already flagged for moderation")
    
    review.flagged_at = datetime.utcnow()
    review.flagged_by_user_id = user_id
    review.flag_reason = flag_reason
    review.moderation_status = "under_review"
    
    await db.commit()
    await db.refresh(review)
    
    return review


# ============================================================================
# Expert Responses
# ============================================================================

async def create_review_response(
    db: AsyncSession,
    review_id: int,
    professional_id: uuid.UUID,
    response_text: str,
) -> ProfessionalReviewResponse:
    """Create an expert response to a review."""
    
    # Verify review exists and belongs to this professional
    review_result = await db.execute(
        select(ProfessionalReview).where(
            and_(
                ProfessionalReview.id == review_id,
                ProfessionalReview.professional_id == professional_id,
            )
        )
    )
    review = review_result.scalar_one_or_none()
    
    if not review:
        raise ValueError("Review not found or not owned by this professional")
    
    # Check if response already exists
    existing_response = await db.execute(
        select(ProfessionalReviewResponse).where(
            ProfessionalReviewResponse.review_id == review_id
        )
    )
    if existing_response.scalar_one_or_none():
        raise ValueError("Response already exists for this review")
    
    # Create response
    response = ProfessionalReviewResponse(
        review_id=review_id,
        professional_id=professional_id,
        response_text=response_text,
    )
    
    db.add(response)
    await db.commit()
    await db.refresh(response)
    
    return response


async def update_review_response(
    db: AsyncSession,
    response_id: int,
    professional_id: uuid.UUID,
    response_text: str,
) -> ProfessionalReviewResponse:
    """Update an expert response."""
    
    result = await db.execute(
        select(ProfessionalReviewResponse).where(
            and_(
                ProfessionalReviewResponse.id == response_id,
                ProfessionalReviewResponse.professional_id == professional_id,
            )
        )
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise ValueError("Response not found or not owned by this professional")
    
    response.response_text = response_text
    response.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(response)
    
    return response


async def delete_review_response(
    db: AsyncSession,
    response_id: int,
    professional_id: uuid.UUID,
) -> bool:
    """Delete an expert response."""
    
    result = await db.execute(
        select(ProfessionalReviewResponse).where(
            and_(
                ProfessionalReviewResponse.id == response_id,
                ProfessionalReviewResponse.professional_id == professional_id,
            )
        )
    )
    response = result.scalar_one_or_none()
    
    if not response:
        return False
    
    await db.delete(response)
    await db.commit()
    
    return True
