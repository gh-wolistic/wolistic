"""Schemas for reviews, client list, and expert responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ============================================================================
# Expert Client (Client List Management)
# ============================================================================

class ExpertClientCreateIn(BaseModel):
    """Schema for adding a client to expert's client list."""
    client_name: str = Field(..., min_length=1, max_length=255)
    client_email: str = Field(..., min_length=3, max_length=255)
    service_notes: str | None = Field(None, max_length=1000)


class ExpertClientOut(BaseModel):
    """Schema for expert client output."""
    id: int
    professional_id: str
    client_user_id: str | None
    client_name: str
    client_email: str
    service_notes: str | None
    status: str  # pending, registered, reviewed
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Reviews
# ============================================================================

class ReviewCreateIn(BaseModel):
    """Schema for creating a review."""
    professional_id: str = Field(..., description="UUID of the professional being reviewed")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    review_text: str | None = Field(None, max_length=1000, description="Optional review text")
    booking_id: int | None = Field(None, description="Optional booking ID for verified clients")


class ReviewOut(BaseModel):
    """Schema for review output."""
    id: int
    professional_id: str
    reviewer_user_id: str
    reviewer_name: str | None = None
    reviewer_email: str | None = None
    rating: int
    review_text: str | None
    is_verified: bool
    verification_type: str  # 'verified_client' or 'wolistic_user'
    booking_id: int | None
    service_name: str | None
    flagged_at: datetime | None
    flagged_by_user_id: str | None
    flag_reason: str | None
    moderation_status: str | None
    created_at: datetime
    
    # Nested response if exists
    response: "ReviewResponseOut | None" = None

    class Config:
        from_attributes = True


class ReviewsSummaryOut(BaseModel):
    """Schema for reviews summary statistics."""
    total_reviews: int
    avg_rating: float
    verified_count: int
    wolistic_user_count: int
    response_rate: float  # Percentage of reviews with expert responses


class ReviewsListOut(BaseModel):
    """Schema for paginated reviews list."""
    reviews: list[ReviewOut]
    summary: ReviewsSummaryOut


class ReviewFlagIn(BaseModel):
    """Schema for flagging a review."""
    flag_reason: str = Field(..., min_length=10, max_length=500)


# ============================================================================
# Review Responses (Expert Responses)
# ============================================================================

class ReviewResponseCreateIn(BaseModel):
    """Schema for creating an expert response to a review."""
    response_text: str = Field(..., min_length=10, max_length=500)


class ReviewResponseUpdateIn(BaseModel):
    """Schema for updating an expert response."""
    response_text: str = Field(..., min_length=10, max_length=500)


class ReviewResponseOut(BaseModel):
    """Schema for review response output."""
    id: int
    review_id: int
    professional_id: str
    response_text: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Utility Schemas
# ============================================================================

class ReviewEligibilityOut(BaseModel):
    """Schema for checking if user can review a professional."""
    can_review: bool
    reason: str | None = None
    verification_type: Literal["verified_client", "wolistic_user"] | None = None


# Update forward refs
ReviewOut.model_rebuild()
