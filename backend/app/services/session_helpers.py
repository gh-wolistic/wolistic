"""
Session/Class business logic helpers.

Includes:
- Tier limit enforcement
- Session publication validation
- Immutability checks
- Refund processing
- Reliability scoring
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classes import (
    ClassEnrollment,
    ClassSession,
    ExpertSessionReliability,
    GroupClass,
    TierLimit,
)

if TYPE_CHECKING:
    from app.models.professional import Professional


# ── Constants ─────────────────────────────────────────────────────────────────

TIER_NAMES = {
    "free": "Free",
    "pro": "Pro",
    "elite": "Elite",
    "celeb": "Celeb",
}

NEXT_TIER = {
    "free": "pro",
    "pro": "elite",
    "elite": "celeb",
    "celeb": None,
}

# Enrollment status values
ENROLLMENT_STATUS_CONFIRMED = "confirmed"
ENROLLMENT_STATUS_ATTENDED = "attended"
ENROLLMENT_STATUS_NO_SHOW_CLIENT = "no_show_client"
ENROLLMENT_STATUS_CANCELLED_EXPERT = "cancelled_expert"
ENROLLMENT_STATUS_CANCELLED_CLIENT = "cancelled_client"
ENROLLMENT_STATUS_REFUNDED = "refunded"

# Session status values
SESSION_STATUS_DRAFT = "draft"
SESSION_STATUS_PUBLISHED = "published"
SESSION_STATUS_CANCELLED = "cancelled"


# ── Tier Enforcement ──────────────────────────────────────────────────────────

async def get_tier_limits(db: AsyncSession, tier_name: str) -> TierLimit | None:
    """Get tier limit configuration for a specific tier."""
    result = await db.execute(select(TierLimit).where(TierLimit.tier_name == tier_name))
    return result.scalar_one_or_none()


async def check_active_class_limit(
    db: AsyncSession,
    professional_id: uuid.UUID,
    tier_name: str,
) -> tuple[int, int]:
    """
    Check if professional can create another active class.
    
    Returns:
        (current_count, limit)
    
    Raises:
        HTTPException: 403 if limit exceeded
    """
    # Get tier limits
    tier_limit = await get_tier_limits(db, tier_name)
    if not tier_limit:
        raise HTTPException(status_code=500, detail="Tier configuration not found")
    
    # Count active classes (status='active' AND expires_on > today)
    active_count = await db.scalar(
        select(func.count(GroupClass.id))
        .where(GroupClass.professional_id == professional_id)
        .where(GroupClass.status == "active")
        .where(GroupClass.expires_on > date.today())
    )
    active_count = active_count or 0
    
    # Check limit
    if active_count >= tier_limit.max_active_classes:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "tier_limit_reached",
                "tier": tier_name,
                "limit": tier_limit.max_active_classes,
                "current_usage": active_count,
                "upgrade_required": True,
                "next_tier": NEXT_TIER.get(tier_name),
            },
        )
    
    return active_count, tier_limit.max_active_classes


async def check_monthly_session_limit(
    db: AsyncSession,
    professional_id: uuid.UUID,
    tier_name: str,
    target_session_date: date,
) -> tuple[int, int]:
    """
    Check if professional can create another session in the target month.
    
    Args:
        target_session_date: The date of the session being created
    
    Returns:
        (current_count, limit)
    
    Raises:
        HTTPException: 403 if limit exceeded
    """
    # Get tier limits
    tier_limit = await get_tier_limits(db, tier_name)
    if not tier_limit:
        raise HTTPException(status_code=500, detail="Tier configuration not found")
    
    # Calculate month boundaries
    session_month = target_session_date.replace(day=1)
    next_month = (session_month + timedelta(days=32)).replace(day=1)
    
    # Count published sessions in the target month for this professional
    sessions_count = await db.scalar(
        select(func.count(ClassSession.id))
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(GroupClass.professional_id == professional_id)
        .where(ClassSession.status == SESSION_STATUS_PUBLISHED)
        .where(ClassSession.session_date >= session_month)
        .where(ClassSession.session_date < next_month)
    )
    sessions_count = sessions_count or 0
    
    # Check limit
    if sessions_count >= tier_limit.max_sessions_per_month:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "monthly_session_limit_reached",
                "tier": tier_name,
                "limit": tier_limit.max_sessions_per_month,
                "current_usage": sessions_count,
                "month": session_month.strftime("%B %Y"),
                "upgrade_required": True,
                "next_tier": NEXT_TIER.get(tier_name),
            },
        )
    
    return sessions_count, tier_limit.max_sessions_per_month


async def get_tier_usage(
    db: AsyncSession,
    professional_id: uuid.UUID,
    tier_name: str,
) -> dict:
    """
    Get current usage statistics vs tier limits.
    
    Returns:
        {
            "tier": "pro",
            "limits": {"max_active_classes": 5, "max_sessions_per_month": 20},
            "usage": {"active_classes": 3, "sessions_this_month": 12, "current_month": "April 2026"},
            "upgrade_available": True,
            "next_tier": "elite"
        }
    """
    tier_limit = await get_tier_limits(db, tier_name)
    if not tier_limit:
        raise HTTPException(status_code=500, detail="Tier configuration not found")
    
    # Count active classes
    active_count = await db.scalar(
        select(func.count(GroupClass.id))
        .where(GroupClass.professional_id == professional_id)
        .where(GroupClass.status == "active")
        .where(GroupClass.expires_on > date.today())
    )
    active_count = active_count or 0
    
    # Count sessions this month
    current_month = date.today().replace(day=1)
    next_month = (current_month + timedelta(days=32)).replace(day=1)
    
    sessions_count = await db.scalar(
        select(func.count(ClassSession.id))
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(GroupClass.professional_id == professional_id)
        .where(ClassSession.status == SESSION_STATUS_PUBLISHED)
        .where(ClassSession.session_date >= current_month)
        .where(ClassSession.session_date < next_month)
    )
    sessions_count = sessions_count or 0
    
    return {
        "tier": tier_name,
        "limits": {
            "max_active_classes": tier_limit.max_active_classes,
            "max_sessions_per_month": tier_limit.max_sessions_per_month,
        },
        "usage": {
            "active_classes": active_count,
            "sessions_this_month": sessions_count,
            "current_month": current_month.strftime("%B %Y"),
        },
        "upgrade_available": NEXT_TIER.get(tier_name) is not None,
        "next_tier": NEXT_TIER.get(tier_name),
    }


# ── Session Publication Validation ────────────────────────────────────────────

async def validate_session_publication(
    db: AsyncSession,
    session: ClassSession,
    group_class: GroupClass,
) -> None:
    """
    Validate that a session can be published.
    
    Checks:
    - Session is in draft status
    - Session date is within class expiry
    - Class template is not cancelled
    
    Raises:
        HTTPException: If validation fails
    """
    if session.status != SESSION_STATUS_DRAFT:
        raise HTTPException(
            status_code=400,
            detail=f"Session is already {session.status}. Only draft sessions can be published.",
        )
    
    if group_class.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot publish sessions for a cancelled class template.",
        )
    
    if session.session_date > group_class.expires_on:
        raise HTTPException(
            status_code=400,
            detail=f"Session date ({session.session_date}) is beyond class expiry date ({group_class.expires_on}). Renew class first.",
        )


async def can_edit_session(
    db: AsyncSession,
    session: ClassSession,
) -> tuple[bool, str | None]:
    """
    Check if a session can be edited.
    
    Returns:
        (can_edit, reason_if_cannot)
    """
    # Draft sessions can always be edited
    if session.status == SESSION_STATUS_DRAFT:
        return True, None
    
    # Cancelled sessions cannot be edited
    if session.status == SESSION_STATUS_CANCELLED:
        return False, "Cannot edit cancelled sessions"
    
    # Published sessions: check if locked (has enrollments or interest)
    if session.is_locked:
        # Count enrollments
        enrollments_count = await db.scalar(
            select(func.count(ClassEnrollment.id)).where(
                ClassEnrollment.class_session_id == session.id
            )
        )
        if enrollments_count and enrollments_count > 0:
            return False, "Cannot edit - users have enrolled. Date/time/location are locked."
    
    return True, None


# ── Class Template Expiry Validation ──────────────────────────────────────────

async def validate_class_expiry(
    db: AsyncSession,
    group_class: GroupClass,
    new_session_date: date,
) -> None:
    """
    Validate that a new session can be created for this class template.
    
    Raises:
        HTTPException: If class is expired or session date exceeds expiry
    """
    if new_session_date > group_class.expires_on:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "class_expired",
                "message": f"Cannot create session beyond class expiry date ({group_class.expires_on})",
                "expires_on": str(group_class.expires_on),
                "action_required": "renew_class",
            },
        )


# ── Reliability Tracking ──────────────────────────────────────────────────────

async def get_or_create_reliability(
    db: AsyncSession,
    professional_id: uuid.UUID,
) -> ExpertSessionReliability:
    """Get or create reliability tracking record for a professional."""
    result = await db.execute(
        select(ExpertSessionReliability).where(
            ExpertSessionReliability.professional_id == professional_id
        )
    )
    reliability = result.scalar_one_or_none()
    
    if not reliability:
        reliability = ExpertSessionReliability(
            professional_id=professional_id,
            total_sessions=0,
            cancelled_sessions=0,
            late_cancellations=0,
            no_show_sessions=0,
            reliability_score=1.0,
        )
        db.add(reliability)
        await db.flush()
    
    return reliability


async def update_reliability_on_cancel(
    db: AsyncSession,
    professional_id: uuid.UUID,
    session_date: date,
    session_time: datetime,
) -> None:
    """
    Update expert reliability when they cancel a session.
    
    Penalties:
    - Late cancellation (<24h): higher impact
    - Regular cancellation (>24h): lower impact
    """
    reliability = await get_or_create_reliability(db, professional_id)
    
    # Check if late cancellation (<24h before session)
    time_until_session = (datetime.combine(session_date, session_time.time()) - datetime.now()).total_seconds()
    is_late = time_until_session < 86400  # 24 hours in seconds
    
    reliability.cancelled_sessions += 1
    if is_late:
        reliability.late_cancellations += 1
    
    # Recalculate reliability score
    # Formula: (total - cancelled - late*2 - no_shows*1.5) / total
    # Weighted penalties: late cancellation = 2x, no-show = 1.5x, regular cancel = 1x
    if reliability.total_sessions > 0:
        penalty = (
            reliability.cancelled_sessions
            + reliability.late_cancellations * 2
            + reliability.no_show_sessions * 1.5
        )
        reliability.reliability_score = max(
            0.0, (reliability.total_sessions - penalty) / reliability.total_sessions
        )
    
    reliability.updated_at = datetime.utcnow()
    await db.flush()


async def update_reliability_on_no_show(
    db: AsyncSession,
    professional_id: uuid.UUID,
) -> None:
    """Update expert reliability when they no-show (don't mark attendance)."""
    reliability = await get_or_create_reliability(db, professional_id)
    
    reliability.no_show_sessions += 1
    
    # Recalculate reliability score
    if reliability.total_sessions > 0:
        penalty = (
            reliability.cancelled_sessions
            + reliability.late_cancellations * 2
            + reliability.no_show_sessions * 1.5
        )
        reliability.reliability_score = max(
            0.0, (reliability.total_sessions - penalty) / reliability.total_sessions
        )
    
    reliability.updated_at = datetime.utcnow()
    await db.flush()
