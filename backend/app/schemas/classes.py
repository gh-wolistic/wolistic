from __future__ import annotations

from datetime import date, time, datetime
from typing import List

from pydantic import BaseModel, Field


# ── Work Locations ────────────────────────────────────────────────────────────

class WorkLocationIn(BaseModel):
    name: str = Field(..., max_length=255)
    address: str | None = Field(None, max_length=500)
    location_type: str = Field("gym", max_length=32)


class WorkLocationOut(BaseModel):
    id: int
    name: str
    address: str | None
    location_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Group Classes ─────────────────────────────────────────────────────────────

class GroupClassIn(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field("other", max_length=32)
    status: str = Field("draft", max_length=16)
    duration_minutes: int = Field(60, ge=1)
    capacity: int = Field(20, ge=1)
    price: float = Field(0.0, ge=0)
    description: str | None = None
    work_location_id: int | None = None
    display_term: str = Field("session", max_length=16)  # session | workshop | class
    expires_on: date | None = None  # Auto-set to +3 months if not provided


class GroupClassPatch(BaseModel):
    title: str | None = Field(None, max_length=255)
    category: str | None = Field(None, max_length=32)
    status: str | None = Field(None, max_length=16)
    duration_minutes: int | None = Field(None, ge=1)
    capacity: int | None = Field(None, ge=1)
    price: float | None = Field(None, ge=0)
    description: str | None = None
    work_location_id: int | None = None
    display_term: str | None = Field(None, max_length=16)


class SessionScheduleOut(BaseModel):
    id: int
    session_date: date
    start_time: time
    status: str  # draft | published | cancelled
    enrolled_count: int = 0
    is_sold_out: bool = False

    model_config = {"from_attributes": True}


class GroupClassOut(BaseModel):
    id: int
    title: str
    category: str
    status: str
    duration_minutes: int
    capacity: int
    price: float
    description: str | None
    work_location_id: int | None
    work_location_name: str | None
    display_term: str
    expires_on: date
    expired_action_taken: str | None
    upcoming_sessions: List[SessionScheduleOut] = []
    enrolled_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Class Sessions ────────────────────────────────────────────────────────────

class ClassSessionIn(BaseModel):
    session_date: date
    start_time: time


class BulkSessionIn(BaseModel):
    """Schema for creating multiple recurring sessions"""
    recurrence_type: str  # "single", "daily", "weekly"
    start_date: date
    start_time: time
    end_date: date | None = None  # For date range
    number_of_sessions: int | None = None  # Alternative to end_date
    days_of_week: List[int] | None = None  # For weekly: [0=Mon, 1=Tue, ..., 6=Sun]


class BulkSessionOut(BaseModel):
    """Response for bulk session creation"""
    sessions_created: int
    sessions: List[ClassSessionOut]


class ClassSessionOut(BaseModel):
    id: int
    group_class_id: int
    session_date: date
    start_time: time
    status: str
    published_at: datetime | None
    is_locked: bool
    cancelled_at: datetime | None
    enrolled_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Class Enrollments ─────────────────────────────────────────────────────────

class ClassEnrollmentIn(BaseModel):
    client_name: str = Field(..., max_length=255)
    expert_client_id: int | None = None
    client_user_id: str | None = None  # UUID as string for public enrollments
    status: str = Field("confirmed", max_length=16)
    payment_status: str = Field("pending", max_length=16)
    source: str = Field("manual", max_length=16)  # public | manual


class ClassEnrollmentPatch(BaseModel):
    status: str | None = Field(None, max_length=16)
    payment_status: str | None = Field(None, max_length=16)


class ClassEnrollmentOut(BaseModel):
    id: int
    class_session_id: int
    expert_client_id: int | None
    client_user_id: str | None  # UUID as string
    client_name: str
    status: str
    payment_status: str
    source: str
    refund_amount: float | None
    refund_processed_at: datetime | None
    refund_provider_id: str | None
    # denormalised from the session/class join
    class_title: str | None = None
    session_date: date | None = None
    start_time: time | None = None
    work_location_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Session Publication & Management ──────────────────────────────────────────

class SessionPublishRequest(BaseModel):
    """Request to publish a draft session (no body needed, just POST)."""
    pass


class SessionCancelRequest(BaseModel):
    """Request to cancel a published session."""
    cancellation_reason: str = Field(..., max_length=500)


class AttendanceMarkRequest(BaseModel):
    """Mark attendance for an enrollment."""
    attendance_status: str = Field(..., max_length=32)  # attended | no_show_client | session_cancelled


class ClassRenewRequest(BaseModel):
    """Renew an expired class template."""
    new_expiry_date: date
    update_details: bool = False  # Only allowed if no active enrollments


# ── Tier Limits & Usage ───────────────────────────────────────────────────────

class TierLimitConfig(BaseModel):
    """Tier limit configuration."""
    max_active_classes: int
    max_sessions_per_month: int


class TierUsage(BaseModel):
    """Current usage against tier limits."""
    active_classes: int
    sessions_this_month: int
    current_month: str  # e.g., "April 2026"


class TierLimitsResponse(BaseModel):
    """Complete tier limits and usage response."""
    tier: str
    limits: TierLimitConfig
    usage: TierUsage
    upgrade_available: bool
    next_tier: str | None = None


# ── Public Session Discovery ──────────────────────────────────────────────────

class PublicSessionOut(BaseModel):
    """Public-facing session details for client enrollment."""
    id: int
    class_id: int
    title: str  # From group_class
    category: str
    display_term: str  # session | workshop | class
    session_date: date
    start_time: time
    duration_minutes: int
    capacity: int
    enrolled_count: int
    is_sold_out: bool
    price: float
    description: str | None
    work_location: dict | None  # {name, address, location_type}

    model_config = {"from_attributes": True}


class SessionEnrollmentRequest(BaseModel):
    """Public enrollment request (client-facing)."""
    payment_provider: str = Field(..., max_length=32)  # razorpay
    payment_order_id: str = Field(..., max_length=128)


class SessionInterestRequest(BaseModel):
    """Register interest in sold-out session (no body needed)."""
    pass


# ── Session Enrollment Payment Schemas ───────────────────────────────────────


class CreateEnrollmentOrderIn(BaseModel):
    """Request to create payment order for session enrollment."""
    customer_name: str | None = Field(default=None, max_length=255)
    customer_email: str | None = Field(default=None, max_length=255)


class CreateEnrollmentOrderOut(BaseModel):
    """Response with Razorpay order details for enrollment."""
    mode: str
    key_id: str
    order_id: str
    enrollment_reference: str
    amount_subunits: int
    currency: str


class VerifyEnrollmentIn(BaseModel):
    """Request to verify enrollment payment."""
    razorpay_order_id: str = Field(min_length=3, max_length=128)
    razorpay_payment_id: str = Field(min_length=3, max_length=128)
    razorpay_signature: str = Field(min_length=3, max_length=512)
    enrollment_reference: str = Field(min_length=4, max_length=64)


class VerifyEnrollmentOut(BaseModel):
    """Response after enrollment payment verification."""
    enrollment_id: int
    status: str
    session_details: dict
    payment_confirmation: dict
    message: str
