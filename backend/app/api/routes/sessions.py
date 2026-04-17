"""
Public-facing session endpoints for client enrollment.

Endpoints:
- GET /sessions/{session_id} - Get session details
- POST /sessions/{session_id}/enroll/order - Create enrollment payment order
- POST /sessions/{session_id}/enroll/verify - Verify payment and confirm enrollment
- POST /sessions/{session_id}/interest - Register interest for sold-out sessions
"""

from __future__ import annotations

import logging
import secrets
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.models.classes import (
    ClassEnrollment,
    ClassSession,
    GroupClass,
    SessionInterest,
    WorkLocation,
    EnrollmentPayment,
)
from app.models.user import User
from app.schemas.classes import (
    PublicSessionOut,
    CreateEnrollmentOrderIn,
    CreateEnrollmentOrderOut,
    VerifyEnrollmentIn,
    VerifyEnrollmentOut,
)
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentVerificationRequest,
)
from app.services.payments.service import get_payment_provider


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions-public"])


# ── Public Session Discovery ──────────────────────────────────────────────────


async def _build_public_session_out(
    session: ClassSession,
    group_class: GroupClass,
    work_location: WorkLocation | None,
    enrolled_count: int,
) -> PublicSessionOut:
    """Helper to build PublicSessionOut response."""
    is_sold_out = enrolled_count >= group_class.capacity
    
    work_location_dict = None
    if work_location:
        work_location_dict = {
            "name": work_location.name,
            "address": work_location.address,
            "location_type": work_location.location_type,
        }
    
    return PublicSessionOut(
        id=session.id,
        class_id=group_class.id,
        title=group_class.title,
        category=group_class.category,
        display_term=group_class.display_term,
        session_date=session.session_date,
        start_time=session.start_time,
        duration_minutes=group_class.duration_minutes,
        capacity=group_class.capacity,
        enrolled_count=enrolled_count,
        is_sold_out=is_sold_out,
        price=float(group_class.price),
        description=group_class.description,
        work_location=work_location_dict,
    )


@router.get("/{session_id}", response_model=PublicSessionOut)
async def get_session_details(
    session_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> PublicSessionOut:
    """
    Get public session details.
    
    No auth required - publicly visible for SEO and discovery.
    """
    # Fetch session with class and location
    result = await db.execute(
        select(ClassSession, GroupClass, WorkLocation)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .outerjoin(WorkLocation, GroupClass.work_location_id == WorkLocation.id)
        .where(ClassSession.id == session_id)
        .where(ClassSession.status == "published")  # Only published sessions
    )
    row = result.one_or_none()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found or not published")
    
    session, group_class, work_location = row
    
    # Count enrollments
    enrolled_count = await db.scalar(
        select(func.count(ClassEnrollment.id))
        .where(ClassEnrollment.class_session_id == session.id)
        .where(ClassEnrollment.status.in_(["confirmed", "attended"]))
    ) or 0
    
    return await _build_public_session_out(session, group_class, work_location, enrolled_count)


# ── Session Enrollment ────────────────────────────────────────────────────────


def _generate_enrollment_reference() -> str:
    """Generate unique enrollment reference."""
    return f"ENR-{secrets.token_urlsafe(12).upper()}"


@router.post("/{session_id}/enroll/order", response_model=CreateEnrollmentOrderOut)
async def create_enrollment_order(
    session_id: int,
    payload: CreateEnrollmentOrderIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> CreateEnrollmentOrderOut:
    """
    Step 1: Create payment order for session enrollment.
    
    Creates a pending enrollment record and Razorpay order.
    Frontend will use the order details to open Razorpay checkout.
    
    Requirements:
    - User must be authenticated
    - Session must be published and have capacity
    - User cannot already be enrolled
    """
    # Fetch session with class
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassSession.id == session_id)
        .where(ClassSession.status == "published")
    )
    row = result.one_or_none()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found or not available")
    
    session, group_class = row
    
    # Check capacity
    enrolled_count = await db.scalar(
        select(func.count(ClassEnrollment.id))
        .where(ClassEnrollment.class_session_id == session.id)
        .where(ClassEnrollment.status.in_(["confirmed", "attended"]))
    ) or 0
    
    if enrolled_count >= group_class.capacity:
        raise HTTPException(status_code=400, detail="Session is sold out")
    
    # Check for duplicate enrollment
    existing = await db.scalar(
        select(func.count(ClassEnrollment.id))
        .where(ClassEnrollment.class_session_id == session.id)
        .where(ClassEnrollment.client_user_id == current_user.user_id)
        .where(ClassEnrollment.status.in_(["confirmed", "attended"]))
    )
    
    if existing and existing > 0:
        raise HTTPException(status_code=409, detail="You are already enrolled in this session")
    
    # Get user details
    user_result = await db.execute(
        select(User).where(User.id == current_user.user_id)
    )
    user = user_result.scalar_one_or_none()
    client_name = payload.customer_name or (user.full_name if user else "Unknown")
    
    # Create pending enrollment
    enrollment_reference = _generate_enrollment_reference()
    enrollment = ClassEnrollment(
        class_session_id=session.id,
        client_user_id=current_user.user_id,
        client_name=client_name,
        status="confirmed",  # Will be confirmed after payment
        payment_status="pending",
        source="public",
    )
    db.add(enrollment)
    await db.flush()
    
    # Create Razorpay order
    amount_decimal = Decimal(str(group_class.price))
    if amount_decimal <= 0:
        raise HTTPException(status_code=422, detail="Session price must be greater than zero")
    
    logger.info(
        "Creating enrollment payment order",
        extra={
            "user_id": str(current_user.user_id),
            "session_id": session.id,
            "enrollment_id": enrollment.id,
            "amount": str(amount_decimal),
            "enrollment_reference": enrollment_reference,
        },
    )
    
    provider = get_payment_provider(settings)
    provider_order = provider.create_order(
        request=PaymentOrderRequest(
            amount=amount_decimal,
            currency="INR",
            booking_reference=enrollment_reference,  # Using enrollment_reference as booking_reference
        )
    )
    
    logger.info(
        "Enrollment payment order created",
        extra={
            "user_id": str(current_user.user_id),
            "order_id": provider_order.order_id,
            "amount_subunits": provider_order.amount_subunits,
        },
    )
    
    # Save payment record
    payment = EnrollmentPayment(
        enrollment_id=enrollment.id,
        provider=provider_order.provider,
        provider_order_id=provider_order.order_id,
        provider_payload=provider_order.provider_payload,
        amount=amount_decimal,
        currency=provider_order.currency,
        status="created",
    )
    db.add(payment)
    await db.commit()
    
    return CreateEnrollmentOrderOut(
        mode=provider_order.mode,
        key_id=provider_order.key_id,
        order_id=provider_order.order_id,
        enrollment_reference=enrollment_reference,
        amount_subunits=provider_order.amount_subunits,
        currency=provider_order.currency,
    )


@router.post("/{session_id}/enroll/verify", response_model=VerifyEnrollmentOut)
async def verify_enrollment_payment(
    session_id: int,
    payload: VerifyEnrollmentIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> VerifyEnrollmentOut:
    """
    Step 2: Verify payment and confirm enrollment.
    
    Validates Razorpay payment signature and updates enrollment to confirmed status.
    
    Requirements:
    - User must be authenticated
    - Payment must be valid (verified with Razorpay)
    - Enrollment must exist and belong to current user
    """
    # Find enrollment by payment order
    payment_result = await db.execute(
        select(EnrollmentPayment, ClassEnrollment, ClassSession, GroupClass)
        .join(ClassEnrollment, EnrollmentPayment.enrollment_id == ClassEnrollment.id)
        .join(ClassSession, ClassEnrollment.class_session_id == ClassSession.id)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(EnrollmentPayment.provider_order_id == payload.razorpay_order_id)
        .where(ClassEnrollment.client_user_id == current_user.user_id)
    )
    row = payment_result.one_or_none()
    
    if row is None:
        logger.warning(
            "Enrollment payment verification failed - order not found",
            extra={
                "user_id": str(current_user.user_id),
                "razorpay_order_id": payload.razorpay_order_id,
            },
        )
        raise HTTPException(status_code=404, detail="Payment order not found")
    
    payment, enrollment, session, group_class = row
    
    # Check for payment ID mismatch (already verified)
    if payment.provider_payment_id and payment.provider_payment_id != payload.razorpay_payment_id:
        logger.error(
            "Payment verification failed - payment ID mismatch",
            extra={
                "user_id": str(current_user.user_id),
                "existing_payment_id": payment.provider_payment_id,
                "new_payment_id": payload.razorpay_payment_id,
            },
        )
        raise HTTPException(status_code=409, detail="Payment already verified with different ID")
    
    # Verify with Razorpay
    provider = get_payment_provider(settings)
    try:
        verification = provider.verify_payment(
            PaymentVerificationRequest(
                order_id=payload.razorpay_order_id,
                payment_id=payload.razorpay_payment_id,
                signature=payload.razorpay_signature,
            )
        )
    except HTTPException as e:
        logger.error(
            "Razorpay signature verification failed",
            extra={
                "user_id": str(current_user.user_id),
                "razorpay_order_id": payload.razorpay_order_id,
                "error_status": e.status_code,
            },
        )
        raise
    
    # Update payment record
    payment.status = verification.status
    payment.provider_payment_id = verification.provider_payment_id
    payment.provider_signature = verification.provider_signature
    from app.services.payments.service import _merge_provider_payload, _now_utc
    payment.provider_payload = _merge_provider_payload(payment.provider_payload, verification.provider_payload)
    payment.verified_at = _now_utc()
    
    # Update enrollment status
    if verification.status == "success":
        enrollment.payment_status = "paid"
        enrollment.status = "confirmed"
        
        # Lock session (immutability protection)
        if not session.is_locked:
            session.is_locked = True
    else:
        enrollment.payment_status = "failed"
        enrollment.status = "cancelled_client"
    
    await db.commit()
    
    logger.info(
        "Enrollment payment verified",
        extra={
            "user_id": str(current_user.user_id),
            "enrollment_id": enrollment.id,
            "payment_status": verification.status,
            "session_id": session.id,
        },
    )
    
    return VerifyEnrollmentOut(
        enrollment_id=enrollment.id,
        status=enrollment.status,
        session_details={
            "id": session.id,
            "title": group_class.title,
            "session_date": str(session.session_date),
            "start_time": str(session.start_time),
            "duration_minutes": group_class.duration_minutes,
        },
        payment_confirmation={
            "amount_paid": float(group_class.price),
            "payment_status": enrollment.payment_status,
        },
        message=f"Successfully enrolled in {group_class.title}!" if verification.status == "success" else "Payment verification failed",
    )


# ── Interest Registration (Sold-Out Sessions) ─────────────────────────────────


@router.post("/{session_id}/interest", status_code=status.HTTP_201_CREATED)
async def register_interest(
    session_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Register interest in a sold-out session.
    
    If the session has capacity again (due to cancellations), we'll notify interested users.
    
    Requirements:
    - User must be authenticated
    - Session must be published and sold out
    - User can only register interest once per session
    """
    # Fetch session with class
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassSession.id == session_id)
        .where(ClassSession.status == "published")
    )
    row = result.one_or_none()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found or not available")
    
    session, group_class = row
    
    # Check if session is actually sold out
    enrolled_count = await db.scalar(
        select(func.count(ClassEnrollment.id))
        .where(ClassEnrollment.class_session_id == session.id)
        .where(ClassEnrollment.status.in_(["confirmed", "attended"]))
    ) or 0
    
    if enrolled_count < group_class.capacity:
        raise HTTPException(
            status_code=400,
            detail="Session still has capacity. Please enroll directly instead.",
        )
    
    # Check for existing interest
    existing = await db.scalar(
        select(func.count(SessionInterest.id))
        .where(SessionInterest.class_session_id == session.id)
        .where(SessionInterest.client_user_id == current_user.user_id)
    )
    
    if existing and existing > 0:
        raise HTTPException(status_code=409, detail="You've already registered interest in this session")
    
    # Register interest
    interest = SessionInterest(
        class_session_id=session.id,
        client_user_id=current_user.user_id,
    )
    
    db.add(interest)
    await db.commit()
    await db.refresh(interest)
    
    return {
        "interested": True,
        "session_id": session.id,
        "message": "We'll notify you if spots open up!",
    }
