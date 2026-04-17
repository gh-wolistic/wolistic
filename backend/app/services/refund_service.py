"""
Refund processing service for session cancellations.

Handles:
- Auto-refund processing via payment provider (Razorpay)
- Retry logic for failed refunds
- Expert reliability score updates
- Email notifications
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classes import ClassEnrollment, ClassSession, GroupClass

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


# ── Refund Status Constants ───────────────────────────────────────────────────

REFUND_STATUS_PENDING = "pending"
REFUND_STATUS_PROCESSING = "processing"
REFUND_STATUS_COMPLETED = "completed"
REFUND_STATUS_FAILED = "failed"


# ── Payment Provider Integration ──────────────────────────────────────────────


async def process_razorpay_refund(
    payment_id: str,
    refund_amount: float,
    enrollment_id: int,
) -> dict:
    """
    Process refund via Razorpay API.
    
    Args:
        payment_id: Razorpay payment ID (from booking_payments or similar)
        refund_amount: Amount to refund in INR
        enrollment_id: Enrollment ID for tracking
    
    Returns:
        {
            "success": bool,
            "refund_id": str | None,
            "error": str | None,
            "status": "completed" | "failed"
        }
    
    TODO: Actual Razorpay integration
    - Import razorpay SDK
    - Initialize client with API keys
    - Call razorpay.payment.refund(payment_id, {"amount": amount_in_paise})
    - Handle errors (insufficient balance, invalid payment, etc.)
    """
    # PLACEHOLDER IMPLEMENTATION
    # Replace this with actual Razorpay integration
    
    try:
        # Example Razorpay integration code (commented out for now):
        # import razorpay
        # from app.core.config import get_settings
        # settings = get_settings()
        # client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        # 
        # refund = client.payment.refund(payment_id, {
        #     "amount": int(refund_amount * 100),  # Convert to paise
        #     "speed": "normal",
        #     "notes": {
        #         "enrollment_id": str(enrollment_id),
        #         "reason": "Session cancelled by expert"
        #     }
        # })
        # 
        # return {
        #     "success": True,
        #     "refund_id": refund["id"],
        #     "error": None,
        #     "status": "completed"
        # }
        
        # For now, simulate successful refund
        logger.info(
            f"MOCK REFUND: payment_id={payment_id}, amount=₹{refund_amount}, enrollment_id={enrollment_id}"
        )
        
        mock_refund_id = f"rfnd_mock_{uuid.uuid4().hex[:12]}"
        
        return {
            "success": True,
            "refund_id": mock_refund_id,
            "error": None,
            "status": "completed",
        }
        
    except Exception as e:
        logger.error(f"Razorpay refund failed: {e}")
        return {
            "success": False,
            "refund_id": None,
            "error": str(e),
            "status": "failed",
        }


async def refund_enrollment(
    db: AsyncSession,
    enrollment: ClassEnrollment,
    reason: str = "Session cancelled by expert",
) -> bool:
    """
    Process refund for a single enrollment.
    
    Args:
        db: Database session
        enrollment: Enrollment to refund
        reason: Refund reason for logging
    
    Returns:
        True if refund successful, False otherwise
    
    Side effects:
        - Updates enrollment with refund details
        - Commits to database
        - TODO: Sends email notification to client
    """
    # Fetch session and class to get price
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.id == enrollment.class_session_id)
        .where(ClassSession.id == enrollment.class_session_id)
    )
    row = result.one_or_none()
    if not row:
        logger.error(f"Session not found for enrollment {enrollment.id}")
        return False
    
    session, group_class = row
    refund_amount = float(group_class.price)
    
    # TODO: Fetch payment_id from booking_payments table
    # For now, use mock payment ID
    payment_id = f"pay_mock_{enrollment.id}"
    
    # Process refund via payment provider
    refund_result = await process_razorpay_refund(
        payment_id=payment_id,
        refund_amount=refund_amount,
        enrollment_id=enrollment.id,
    )
    
    if refund_result["success"]:
        # Update enrollment
        enrollment.refund_amount = refund_amount
        enrollment.refund_processed_at = datetime.utcnow()
        enrollment.refund_provider_id = refund_result["refund_id"]
        enrollment.status = "refunded"
        
        await db.commit()
        
        logger.info(
            f"Refund successful: enrollment_id={enrollment.id}, "
            f"amount=₹{refund_amount}, refund_id={refund_result['refund_id']}"
        )
        
        # TODO: Send email notification
        # await send_refund_notification_email(
        #     client_email=enrollment.client_user.email,
        #     client_name=enrollment.client_name,
        #     session_title=group_class.title,
        #     session_date=session.session_date,
        #     refund_amount=refund_amount,
        # )
        
        return True
    else:
        logger.error(
            f"Refund failed: enrollment_id={enrollment.id}, error={refund_result['error']}"
        )
        
        # Mark enrollment for retry
        # enrollment.refund_retry_count += 1  # TODO: Add this field if needed
        
        await db.commit()
        
        return False


async def refund_all_session_enrollments(
    db: AsyncSession,
    session_id: int,
    reason: str = "Session cancelled by expert",
) -> dict:
    """
    Refund all confirmed enrollments for a cancelled session.
    
    Args:
        db: Database session
        session_id: ID of the cancelled session
        reason: Cancellation reason
    
    Returns:
        {
            "total_enrollments": int,
            "successful_refunds": int,
            "failed_refunds": int,
            "total_amount_refunded": float
        }
    """
    # Fetch all confirmed enrollments
    result = await db.execute(
        select(ClassEnrollment)
        .where(ClassEnrollment.class_session_id == session_id)
        .where(ClassEnrollment.status == "confirmed")
    )
    enrollments = result.scalars().all()
    
    successful = 0
    failed = 0
    total_refunded = 0.0
    
    for enrollment in enrollments:
        success = await refund_enrollment(db, enrollment, reason)
        if success:
            successful += 1
            total_refunded += float(enrollment.refund_amount or 0)
        else:
            failed += 1
    
    return {
        "total_enrollments": len(enrollments),
        "successful_refunds": successful,
        "failed_refunds": failed,
        "total_amount_refunded": total_refunded,
    }


# ── Auto-Refund for No-Show Sessions (48h Grace Period) ───────────────────────


async def process_auto_refunds_for_no_show_sessions(db: AsyncSession) -> dict:
    """
    Auto-refund enrollments for sessions where expert didn't mark attendance.
    
    Logic:
    - Find sessions where session_date + 48 hours < now
    - Session status = 'published'
    - Has enrollments with status = 'confirmed' (not marked)
    - Process refund for all such enrollments
    - Update expert reliability score
    
    This should run as a daily cron job.
    
    Returns:
        {
            "sessions_processed": int,
            "enrollments_refunded": int,
            "total_amount_refunded": float
        }
    """
    cutoff_date = datetime.utcnow() - timedelta(hours=48)
    
    # Find sessions that need auto-refund
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassSession.status == "published")
        .where(ClassSession.session_date < cutoff_date.date())
    )
    sessions = result.all()
    
    sessions_processed = 0
    total_enrollments_refunded = 0
    total_refunded = 0.0
    
    for session, group_class in sessions:
        # Check if any enrollments are still "confirmed" (not marked)
        enrollments_result = await db.execute(
            select(ClassEnrollment)
            .where(ClassEnrollment.class_session_id == session.id)
            .where(ClassEnrollment.status == "confirmed")
        )
        enrollments = enrollments_result.scalars().all()
        
        if not enrollments:
            continue  # No unprocessed enrollments
        
        # Process refunds
        for enrollment in enrollments:
            success = await refund_enrollment(
                db,
                enrollment,
                reason="Expert did not mark attendance within 48 hours",
            )
            if success:
                total_enrollments_refunded += 1
                total_refunded += float(enrollment.refund_amount or 0)
        
        # Update session status
        session.status = "cancelled"
        session.cancelled_at = datetime.utcnow()
        
        # TODO: Update expert reliability score
        # from app.services.session_helpers import update_reliability_on_no_show
        # await update_reliability_on_no_show(db, group_class.professional_id)
        
        sessions_processed += 1
    
    await db.commit()
    
    logger.info(
        f"Auto-refund completed: {sessions_processed} sessions, "
        f"{total_enrollments_refunded} enrollments, ₹{total_refunded:.2f} total"
    )
    
    return {
        "sessions_processed": sessions_processed,
        "enrollments_refunded": total_enrollments_refunded,
        "total_amount_refunded": total_refunded,
    }


# ── Retry Failed Refunds ──────────────────────────────────────────────────────


async def retry_failed_refunds(db: AsyncSession, max_retries: int = 3) -> dict:
    """
    Retry refunds that previously failed.
    
    Logic:
    - Find enrollments with status='refunded' but refund_provider_id is NULL
    - Indicates refund was attempted but failed
    - Retry up to max_retries times
    
    Returns:
        {
            "attempted": int,
            "successful": int,
            "still_failed": int
        }
    """
    # Find failed refunds
    result = await db.execute(
        select(ClassEnrollment)
        .where(ClassEnrollment.status.in_(["cancelled_expert", "cancelled_client"]))
        .where(ClassEnrollment.refund_amount.isnot(None))
        .where(ClassEnrollment.refund_provider_id.is_(None))
        .where(ClassEnrollment.refund_processed_at.isnot(None))
    )
    failed_enrollments = result.scalars().all()
    
    attempted = 0
    successful = 0
    still_failed = 0
    
    for enrollment in failed_enrollments:
        # Check if we've exceeded max retries
        # TODO: Track retry count in enrollment model
        # if enrollment.refund_retry_count >= max_retries:
        #     continue
        
        attempted += 1
        
        success = await refund_enrollment(db, enrollment, reason="Retry failed refund")
        
        if success:
            successful += 1
        else:
            still_failed += 1
    
    logger.info(
        f"Retry refunds completed: {attempted} attempted, "
        f"{successful} successful, {still_failed} still failed"
    )
    
    return {
        "attempted": attempted,
        "successful": successful,
        "still_failed": still_failed,
    }
