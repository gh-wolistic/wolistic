from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.classes import ClassEnrollment, ClassSession, GroupClass, WorkLocation
from app.models.professional import Professional
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan
from app.schemas.classes import (
    AttendanceMarkRequest,
    BulkSessionIn,
    BulkSessionOut,
    ClassEnrollmentIn,
    ClassEnrollmentOut,
    ClassEnrollmentPatch,
    ClassRenewRequest,
    ClassSessionIn,
    ClassSessionOut,
    GroupClassIn,
    GroupClassOut,
    GroupClassPatch,
    SessionCancelRequest,
    SessionPublishRequest,
    SessionScheduleOut,
    TierLimitsResponse,
    WorkLocationIn,
    WorkLocationOut,
)
from app.services.session_helpers import (
    check_active_class_limit,
    check_monthly_session_limit,
    get_tier_usage,
    update_reliability_on_cancel,
    validate_class_expiry,
    validate_session_publication,
)
from app.services.refund_service import refund_all_session_enrollments

router = APIRouter(prefix="/partners", tags=["classes"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _require_professional(
    current_user: AuthenticatedUser,
    db: AsyncSession,
) -> Professional:
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    professional = result.scalar_one_or_none()
    if professional is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professional profile not found")
    return professional


async def _build_class_out(gc: GroupClass, db: AsyncSession) -> GroupClassOut:
    # Resolve location name
    work_location_name: str | None = None
    if gc.work_location_id is not None:
        loc_result = await db.execute(
            select(WorkLocation).where(WorkLocation.id == gc.work_location_id)
        )
        loc = loc_result.scalar_one_or_none()
        if loc:
            work_location_name = loc.name

    # Fetch upcoming sessions (today and future)
    today = date.today()
    sessions_result = await db.execute(
        select(ClassSession)
        .where(ClassSession.group_class_id == gc.id)
        .where(ClassSession.session_date >= today)
        .order_by(ClassSession.session_date.asc(), ClassSession.start_time.asc())
    )
    sessions = sessions_result.scalars().all()

    upcoming_sessions: list[SessionScheduleOut] = []
    total_enrolled = 0

    for s in sessions:
        enrolled_result = await db.execute(
            select(func.count(ClassEnrollment.id))
            .where(ClassEnrollment.class_session_id == s.id)
            .where(ClassEnrollment.status == "confirmed")
        )
        enrolled_count = enrolled_result.scalar() or 0
        total_enrolled += enrolled_count
        upcoming_sessions.append(SessionScheduleOut(
            id=s.id,
            session_date=s.session_date,
            start_time=s.start_time,
            status=s.status,
            enrolled_count=enrolled_count,
            is_sold_out=(enrolled_count >= gc.capacity),
        ))

    return GroupClassOut(
        id=gc.id,
        title=gc.title,
        category=gc.category,
        status=gc.status,
        duration_minutes=gc.duration_minutes,
        capacity=gc.capacity,
        price=float(gc.price),
        description=gc.description,
        work_location_id=gc.work_location_id,
        work_location_name=work_location_name,
        display_term=gc.display_term,
        expires_on=gc.expires_on,
        expired_action_taken=gc.expired_action_taken,
        upcoming_sessions=upcoming_sessions,
        enrolled_count=total_enrolled,
        created_at=gc.created_at,
        updated_at=gc.updated_at,
    )


# ── Work Locations ────────────────────────────────────────────────────────────

@router.get("/me/work-locations", response_model=List[WorkLocationOut])
async def list_work_locations(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[WorkLocationOut]:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(WorkLocation)
        .where(WorkLocation.professional_id == professional.user_id)
        .order_by(WorkLocation.created_at.asc())
    )
    return [WorkLocationOut.model_validate(loc) for loc in result.scalars().all()]


@router.post("/me/work-locations", response_model=WorkLocationOut, status_code=status.HTTP_201_CREATED)
async def create_work_location(
    payload: WorkLocationIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> WorkLocationOut:
    professional = await _require_professional(current_user, db)
    loc = WorkLocation(
        professional_id=professional.user_id,
        name=payload.name,
        address=payload.address,
        location_type=payload.location_type,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return WorkLocationOut.model_validate(loc)


@router.delete("/me/work-locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_location(
    location_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(WorkLocation)
        .where(WorkLocation.id == location_id)
        .where(WorkLocation.professional_id == professional.user_id)
    )
    loc = result.scalar_one_or_none()
    if loc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work location not found")
    await db.delete(loc)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Group Classes ─────────────────────────────────────────────────────────────

@router.get("/me/classes", response_model=List[GroupClassOut])
async def list_classes(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[GroupClassOut]:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(GroupClass)
        .where(GroupClass.professional_id == professional.user_id)
        .order_by(GroupClass.created_at.desc())
    )
    classes = result.scalars().all()
    return [await _build_class_out(gc, db) for gc in classes]


@router.post("/me/classes", response_model=GroupClassOut, status_code=status.HTTP_201_CREATED)
async def create_class(
    payload: GroupClassIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> GroupClassOut:
    professional = await _require_professional(current_user, db)
    
    # ── Tier Enforcement ──────────────────────────────────────────────────────
    # Get tier from active subscription
    tier_result = await db.execute(
        select(SubscriptionPlan.tier)
        .join(ProfessionalSubscription, ProfessionalSubscription.plan_id == SubscriptionPlan.id)
        .where(
            ProfessionalSubscription.professional_id == professional.user_id,
            ProfessionalSubscription.status.in_(["active", "grace"]),
        )
    )
    tier_name = tier_result.scalar_one_or_none() or "free"
    await check_active_class_limit(db, professional.user_id, tier_name)
    
    # Set default expiry date if not provided (3 months from now)
    expires_on = payload.expires_on or (date.today() + timedelta(days=90))
    
    gc = GroupClass(
        professional_id=professional.user_id,
        title=payload.title,
        category=payload.category,
        status=payload.status,
        duration_minutes=payload.duration_minutes,
        capacity=payload.capacity,
        price=payload.price,
        description=payload.description,
        work_location_id=payload.work_location_id,
        display_term=payload.display_term,
        expires_on=expires_on,
    )
    db.add(gc)
    await db.commit()
    await db.refresh(gc)
    return await _build_class_out(gc, db)


@router.patch("/me/classes/{class_id}", response_model=GroupClassOut)
async def update_class(
    class_id: int,
    payload: GroupClassPatch,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> GroupClassOut:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    gc = result.scalar_one_or_none()
    if gc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    # ── Tier Enforcement when activating a draft class ───────────────────────
    if payload.status == "active" and gc.status != "active":
        # User is changing status from draft/cancelled to active
        # Check tier limits before allowing activation
        from app.models.subscription import ProfessionalSubscription, SubscriptionPlan
        
        tier_result = await db.execute(
            select(SubscriptionPlan.tier)
            .join(ProfessionalSubscription, ProfessionalSubscription.plan_id == SubscriptionPlan.id)
            .where(
                ProfessionalSubscription.professional_id == professional.user_id,
                ProfessionalSubscription.status.in_(["active", "grace"]),
            )
        )
        tier_name = tier_result.scalar_one_or_none() or "free"
        await check_active_class_limit(db, professional.user_id, tier_name)
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(gc, field, value)
    await db.commit()
    await db.refresh(gc)
    return await _build_class_out(gc, db)


@router.delete("/me/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    gc = result.scalar_one_or_none()
    if gc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    await db.delete(gc)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Class Sessions ────────────────────────────────────────────────────────────

@router.get("/me/classes/{class_id}/sessions", response_model=List[ClassSessionOut])
async def list_sessions(
    class_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[ClassSessionOut]:
    professional = await _require_professional(current_user, db)
    # Verify ownership
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    if cls_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    result = await db.execute(
        select(ClassSession)
        .where(ClassSession.group_class_id == class_id)
        .order_by(ClassSession.session_date.asc(), ClassSession.start_time.asc())
    )
    sessions = result.scalars().all()

    out: list[ClassSessionOut] = []
    for s in sessions:
        enrolled_result = await db.execute(
            select(func.count(ClassEnrollment.id))
            .where(ClassEnrollment.class_session_id == s.id)
            .where(ClassEnrollment.status == "confirmed")
        )
        enrolled_count = enrolled_result.scalar() or 0
        out.append(ClassSessionOut(
            id=s.id,
            group_class_id=s.group_class_id,
            session_date=s.session_date,
            start_time=s.start_time,
            enrolled_count=enrolled_count,
            created_at=s.created_at,
        ))
    return out


@router.post("/me/classes/{class_id}/sessions", response_model=ClassSessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    class_id: int,
    payload: ClassSessionIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClassSessionOut:
    professional = await _require_professional(current_user, db)
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    group_class = cls_result.scalar_one_or_none()
    if group_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    # ── Tier Enforcement (Monthly Session Limit) ─────────────────────────────
    # Get tier from active subscription
    tier_result = await db.execute(
        select(SubscriptionPlan.tier)
        .join(ProfessionalSubscription, ProfessionalSubscription.plan_id == SubscriptionPlan.id)
        .where(
            ProfessionalSubscription.professional_id == professional.user_id,
            ProfessionalSubscription.status.in_(["active", "grace"]),
        )
    )
    tier_name = tier_result.scalar_one_or_none() or "free"
    await check_monthly_session_limit(db, professional.user_id, tier_name, payload.session_date)
    
    # ── Class Expiry Validation ───────────────────────────────────────────────
    await validate_class_expiry(db, group_class, payload.session_date)

    session = ClassSession(
        group_class_id=class_id,
        session_date=payload.session_date,
        start_time=payload.start_time,
        status="draft",  # Always start as draft
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ClassSessionOut(
        id=session.id,
        group_class_id=session.group_class_id,
        session_date=session.session_date,
        start_time=session.start_time,
        status=session.status,
        published_at=session.published_at,
        is_locked=session.is_locked,
        cancelled_at=session.cancelled_at,
        enrolled_count=0,
        created_at=session.created_at,
    )


@router.post("/me/classes/{class_id}/sessions/bulk", response_model=BulkSessionOut, status_code=status.HTTP_201_CREATED)
async def create_bulk_sessions(
    class_id: int,
    payload: BulkSessionIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> BulkSessionOut:
    """
    Create multiple sessions at once based on recurrence pattern.
    
    - recurrence_type: "single", "daily", "weekly"
    - For "weekly": provide days_of_week [0=Mon, 1=Tue, ..., 6=Sun]
    - Specify either end_date or number_of_sessions
    """
    professional = await _require_professional(current_user, db)
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    group_class = cls_result.scalar_one_or_none()
    if group_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    # ── Get tier for validation ───────────────────────────────────────────────
    tier_result = await db.execute(
        select(SubscriptionPlan.tier)
        .join(ProfessionalSubscription, ProfessionalSubscription.plan_id == SubscriptionPlan.id)
        .where(
            ProfessionalSubscription.professional_id == professional.user_id,
            ProfessionalSubscription.status.in_(["active", "grace"]),
        )
    )
    tier_name = tier_result.scalar_one_or_none() or "free"
    
    # ── Generate session dates based on recurrence pattern ────────────────────
    session_dates = []
    current_date = payload.start_date
    
    if payload.recurrence_type == "single":
        session_dates = [payload.start_date]
    
    elif payload.recurrence_type == "daily":
        if payload.end_date:
            while current_date <= payload.end_date:
                session_dates.append(current_date)
                current_date += timedelta(days=1)
        elif payload.number_of_sessions:
            for _ in range(payload.number_of_sessions):
                session_dates.append(current_date)
                current_date += timedelta(days=1)
        else:
            raise HTTPException(400, detail="Provide either end_date or number_of_sessions")
    
    elif payload.recurrence_type == "weekly":
        if not payload.days_of_week:
            raise HTTPException(400, detail="days_of_week required for weekly recurrence")
        
        # Normalize days (0=Mon, 6=Sun) to Python weekday (0=Mon, 6=Sun matches)
        target_weekdays = set(payload.days_of_week)
        
        max_iterations = payload.number_of_sessions if payload.number_of_sessions else 365  # Safety limit
        iteration_count = 0
        
        while len(session_dates) < (payload.number_of_sessions or 999):
            if payload.end_date and current_date > payload.end_date:
                break
            if iteration_count >= max_iterations:
                break
            
            if current_date.weekday() in target_weekdays:
                session_dates.append(current_date)
            
            current_date += timedelta(days=1)
            iteration_count += 1
    
    else:
        raise HTTPException(400, detail="Invalid recurrence_type. Use 'single', 'daily', or 'weekly'")
    
    # ── Validate all sessions ─────────────────────────────────────────────────
    if not session_dates:
        raise HTTPException(400, detail="No sessions generated. Check your recurrence settings.")
    
    # Check expiry for all sessions
    for session_date in session_dates:
        await validate_class_expiry(db, group_class, session_date)
    
    # Check tier limit (count existing + new sessions in each affected month)
    months_to_check = {}
    for session_date in session_dates:
        month_key = session_date.replace(day=1)
        months_to_check[month_key] = months_to_check.get(month_key, 0) + 1
    
    for month_start, new_count in months_to_check.items():
        # Count existing published sessions in this month
        existing_count_result = await db.execute(
            select(func.count(ClassSession.id))
            .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
            .where(
                GroupClass.professional_id == professional.user_id,
                ClassSession.status == "published",
                func.date_trunc('month', ClassSession.session_date) == month_start,
            )
        )
        existing_count = existing_count_result.scalar_one() or 0
        
        # Get tier limit
        tier_limits = {
            "free": 8,
            "pro": 20,
            "elite": 60,
            "celeb": 999999,
        }
        tier_limit = tier_limits.get(tier_name, 8)
        
        if existing_count + new_count > tier_limit:
            raise HTTPException(
                403,
                detail={
                    "error": "monthly_session_limit_reached",
                    "tier": tier_name,
                    "limit": tier_limit,
                    "current_usage": existing_count,
                    "month": month_start.strftime("%B %Y"),
                    "upgrade_required": True,
                    "message": f"Creating {new_count} sessions in {month_start.strftime('%B %Y')} would exceed your {tier_name} tier limit of {tier_limit} sessions/month"
                }
            )
    
    # ── Create all sessions ───────────────────────────────────────────────────
    created_sessions = []
    for session_date in session_dates:
        session = ClassSession(
            group_class_id=class_id,
            session_date=session_date,
            start_time=payload.start_time,
            status="draft",  # Always start as draft
        )
        db.add(session)
        created_sessions.append(session)
    
    await db.commit()
    
    # Refresh all to get IDs
    for session in created_sessions:
        await db.refresh(session)
    
    # Build response
    session_outs = [
        ClassSessionOut(
            id=session.id,
            group_class_id=session.group_class_id,
            session_date=session.session_date,
            start_time=session.start_time,
            status=session.status,
            published_at=session.published_at,
            is_locked=session.is_locked,
            cancelled_at=session.cancelled_at,
            enrolled_count=0,
            created_at=session.created_at,
        )
        for session in created_sessions
    ]
    
    return BulkSessionOut(
        sessions_created=len(session_outs),
        sessions=session_outs,
    )


@router.delete("/me/classes/{class_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    class_id: int,
    session_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    professional = await _require_professional(current_user, db)
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    if cls_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    result = await db.execute(
        select(ClassSession)
        .where(ClassSession.id == session_id)
        .where(ClassSession.group_class_id == class_id)
    )
    s = result.scalar_one_or_none()
    if s is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    await db.delete(s)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Class Enrollments ─────────────────────────────────────────────────────────

@router.get("/me/enrollments", response_model=List[ClassEnrollmentOut])
async def list_enrollments(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[ClassEnrollmentOut]:
    professional = await _require_professional(current_user, db)

    # Get all class IDs for this professional
    class_ids_result = await db.execute(
        select(GroupClass.id).where(GroupClass.professional_id == professional.user_id)
    )
    class_ids = [row[0] for row in class_ids_result.all()]

    if not class_ids:
        return []

    # Get all sessions for those classes
    session_ids_result = await db.execute(
        select(ClassSession.id, ClassSession.session_date, ClassSession.start_time, ClassSession.group_class_id)
        .where(ClassSession.group_class_id.in_(class_ids))
    )
    session_rows = session_ids_result.all()
    session_map = {row[0]: row for row in session_rows}
    session_ids = list(session_map.keys())

    if not session_ids:
        return []

    # Get enrollments
    enrollments_result = await db.execute(
        select(ClassEnrollment)
        .where(ClassEnrollment.class_session_id.in_(session_ids))
        .order_by(ClassEnrollment.created_at.desc())
    )
    enrollments = enrollments_result.scalars().all()

    # Build class title map
    classes_result = await db.execute(
        select(GroupClass).where(GroupClass.id.in_(class_ids))
    )
    class_map = {gc.id: gc for gc in classes_result.scalars().all()}

    # Build work location name map
    loc_ids = {gc.work_location_id for gc in class_map.values() if gc.work_location_id}
    loc_map: dict[int, str] = {}
    if loc_ids:
        locs_result = await db.execute(
            select(WorkLocation).where(WorkLocation.id.in_(loc_ids))
        )
        loc_map = {loc.id: loc.name for loc in locs_result.scalars().all()}

    out: list[ClassEnrollmentOut] = []
    for e in enrollments:
        session_row = session_map.get(e.class_session_id)
        gc = class_map.get(session_row[3]) if session_row else None
        work_location_name = loc_map.get(gc.work_location_id) if gc and gc.work_location_id else None
        out.append(ClassEnrollmentOut(
            id=e.id,
            class_session_id=e.class_session_id,
            expert_client_id=e.expert_client_id,
            client_name=e.client_name,
            status=e.status,
            payment_status=e.payment_status,
            class_title=gc.title if gc else None,
            session_date=session_row[1] if session_row else None,
            start_time=session_row[2] if session_row else None,
            work_location_name=work_location_name,
            created_at=e.created_at,
        ))
    return out


@router.post("/me/classes/{class_id}/sessions/{session_id}/enrollments",
             response_model=ClassEnrollmentOut, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    class_id: int,
    session_id: int,
    payload: ClassEnrollmentIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClassEnrollmentOut:
    professional = await _require_professional(current_user, db)
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    gc = cls_result.scalar_one_or_none()
    if gc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    session_result = await db.execute(
        select(ClassSession)
        .where(ClassSession.id == session_id)
        .where(ClassSession.group_class_id == class_id)
    )
    s = session_result.scalar_one_or_none()
    if s is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    enrollment = ClassEnrollment(
        class_session_id=session_id,
        expert_client_id=payload.expert_client_id,
        client_name=payload.client_name,
        status=payload.status,
        payment_status=payload.payment_status,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    loc_name = None
    if gc.work_location_id:
        loc_result = await db.execute(select(WorkLocation).where(WorkLocation.id == gc.work_location_id))
        loc = loc_result.scalar_one_or_none()
        if loc:
            loc_name = loc.name

    return ClassEnrollmentOut(
        id=enrollment.id,
        class_session_id=enrollment.class_session_id,
        expert_client_id=enrollment.expert_client_id,
        client_name=enrollment.client_name,
        status=enrollment.status,
        payment_status=enrollment.payment_status,
        class_title=gc.title,
        session_date=s.session_date,
        start_time=s.start_time,
        work_location_name=loc_name,
        created_at=enrollment.created_at,
    )


@router.patch("/me/enrollments/{enrollment_id}", response_model=ClassEnrollmentOut)
async def update_enrollment(
    enrollment_id: int,
    payload: ClassEnrollmentPatch,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClassEnrollmentOut:
    professional = await _require_professional(current_user, db)

    result = await db.execute(
        select(ClassEnrollment).where(ClassEnrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    # Verify ownership via session → class → professional
    session_result = await db.execute(
        select(ClassSession).where(ClassSession.id == enrollment.class_session_id)
    )
    s = session_result.scalar_one_or_none()
    cls_result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == s.group_class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    gc = cls_result.scalar_one_or_none()
    if gc is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(enrollment, field, value)
    await db.commit()
    await db.refresh(enrollment)

    loc_name = None
    if gc.work_location_id:
        loc_result = await db.execute(select(WorkLocation).where(WorkLocation.id == gc.work_location_id))
        loc = loc_result.scalar_one_or_none()
        if loc:
            loc_name = loc.name

    return ClassEnrollmentOut(
        id=enrollment.id,
        class_session_id=enrollment.class_session_id,
        expert_client_id=enrollment.expert_client_id,
        client_user_id=str(enrollment.client_user_id) if enrollment.client_user_id else None,
        client_name=enrollment.client_name,
        status=enrollment.status,
        payment_status=enrollment.payment_status,
        source=enrollment.source,
        refund_amount=enrollment.refund_amount,
        refund_processed_at=enrollment.refund_processed_at,
        refund_provider_id=enrollment.refund_provider_id,
        class_title=gc.title,
        session_date=s.session_date,
        start_time=s.start_time,
        work_location_name=loc_name,
        created_at=enrollment.created_at,
    )


# ── Session Publication & Management ──────────────────────────────────────────


@router.post("/me/sessions/{session_id}/publish", response_model=ClassSessionOut)
async def publish_session(
    session_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClassSessionOut:
    """
    Publish a draft session, making it visible to clients.
    
    IMPORTANT: Once published, session date/time/location cannot be changed
    if enrollments or interest exist (immutability protection).
    """
    professional = await _require_professional(current_user, db)
    
    # Fetch session with group_class join
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassSession.id == session_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session, group_class = row
    
    # Validate publication
    await validate_session_publication(db, session, group_class)
    
    # Publish
    session.status = "published"
    session.published_at = datetime.utcnow()
    session.is_locked = False  # Not locked until enrollments exist
    
    await db.commit()
    await db.refresh(session)
    
    # Count enrollments for response
    enrolled_count = await db.scalar(
        select(func.count(ClassEnrollment.id))
        .where(ClassEnrollment.class_session_id == session.id)
    ) or 0
    
    return ClassSessionOut(
        id=session.id,
        group_class_id=session.group_class_id,
        session_date=session.session_date,
        start_time=session.start_time,
        status=session.status,
        published_at=session.published_at,
        is_locked=session.is_locked,
        cancelled_at=session.cancelled_at,
        enrolled_count=enrolled_count,
        created_at=session.created_at,
    )


@router.post("/me/sessions/{session_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_session(
    session_id: int,
    payload: SessionCancelRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Cancel a published session and refund all enrollments.
    
    Side effects:
    - All enrollments -> status='cancelled_expert'
    - Auto-refund initiated for all enrolled clients
    - Expert reliability score updated
    """
    professional = await _require_professional(current_user, db)
    
    # Fetch session
    result = await db.execute(
        select(ClassSession, GroupClass)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassSession.id == session_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session, group_class = row
    
    if session.status == "cancelled":
        raise HTTPException(status_code=400, detail="Session already cancelled")
    
    # Update session status
    session.status = "cancelled"
    session.cancelled_at = datetime.utcnow()
    await db.commit()
    
    # Process refunds for all enrollments
    refund_result = await refund_all_session_enrollments(
        db,
        session_id=session.id,
        reason=f"Session cancelled: {payload.cancellation_reason}",
    )
    
    # Update expert reliability score
    await update_reliability_on_cancel(
        db,
        professional.user_id,
        session.session_date,
        datetime.combine(session.session_date, session.start_time),
    )
    
    return {
        "session_id": session.id,
        "status": "cancelled",
        "enrollments_cancelled": refund_result["total_enrollments"],
        "successful_refunds": refund_result["successful_refunds"],
        "failed_refunds": refund_result["failed_refunds"],
        "total_refunded": refund_result["total_amount_refunded"],
        "refund_status": "processing" if refund_result["failed_refunds"] == 0 else "partial",
        "message": (
            f"Session cancelled. {refund_result['successful_refunds']} clients refunded "
            f"₹{refund_result['total_amount_refunded']:.2f} total."
        ),
    }


@router.post("/me/enrollments/{enrollment_id}/mark-attendance", response_model=ClassEnrollmentOut)
async def mark_attendance(
    enrollment_id: int,
    payload: AttendanceMarkRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ClassEnrollmentOut:
    """
    Mark attendance for a specific enrollment after the session completes.
    
    Status options:
    - 'attended': Client attended, transaction complete
    - 'no_show_client': Client didn't show, expert keeps payment
    - 'session_cancelled': Session didn't run, refund client
    """
    professional = await _require_professional(current_user, db)
    
    # Fetch enrollment with session and class
    result = await db.execute(
        select(ClassEnrollment, ClassSession, GroupClass)
        .join(ClassSession, ClassEnrollment.class_session_id == ClassSession.id)
        .join(GroupClass, ClassSession.group_class_id == GroupClass.id)
        .where(ClassEnrollment.id == enrollment_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    enrollment, session, group_class = row
    
    # Validate session date has passed
    if session.session_date > date.today():
        raise HTTPException(status_code=400, detail="Cannot mark attendance for future sessions")
    
    # Update enrollment status
    if payload.attendance_status == "attended":
        enrollment.status = "attended"
    elif payload.attendance_status == "no_show_client":
        enrollment.status = "no_show_client"
    elif payload.attendance_status == "session_cancelled":
        enrollment.status = "cancelled_expert"
        enrollment.refund_amount = group_class.price
        enrollment.refund_processed_at = datetime.utcnow()
        # TODO: Razorpay refund integration
    else:
        raise HTTPException(status_code=400, detail="Invalid attendance status")
    
    await db.commit()
    await db.refresh(enrollment)
    
    # Build response
    loc_name = None
    if group_class.work_location_id:
        loc_result = await db.execute(
            select(WorkLocation).where(WorkLocation.id == group_class.work_location_id)
        )
        loc = loc_result.scalar_one_or_none()
        if loc:
            loc_name = loc.name
    
    return ClassEnrollmentOut(
        id=enrollment.id,
        class_session_id=enrollment.class_session_id,
        expert_client_id=enrollment.expert_client_id,
        client_user_id=str(enrollment.client_user_id) if enrollment.client_user_id else None,
        client_name=enrollment.client_name,
        status=enrollment.status,
        payment_status=enrollment.payment_status,
        source=enrollment.source,
        refund_amount=enrollment.refund_amount,
        refund_processed_at=enrollment.refund_processed_at,
        refund_provider_id=enrollment.refund_provider_id,
        class_title=group_class.title,
        session_date=session.session_date,
        start_time=session.start_time,
        work_location_name=loc_name,
        created_at=enrollment.created_at,
    )


@router.post("/me/classes/{class_id}/renew", response_model=GroupClassOut)
async def renew_class(
    class_id: int,
    payload: ClassRenewRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> GroupClassOut:
    """
    Renew an expired class template by extending the expiry date.
    
    Can optionally update class details if no active enrollments exist.
    """
    professional = await _require_professional(current_user, db)
    
    # Fetch class
    result = await db.execute(
        select(GroupClass)
        .where(GroupClass.id == class_id)
        .where(GroupClass.professional_id == professional.user_id)
    )
    group_class = result.scalar_one_or_none()
    if group_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check for active enrollments if user wants to update details
    if payload.update_details:
        enrollments_count = await db.scalar(
            select(func.count(ClassEnrollment.id))
            .join(ClassSession, ClassEnrollment.class_session_id == ClassSession.id)
            .where(ClassSession.group_class_id == class_id)
            .where(ClassEnrollment.status.in_(["confirmed", "attended"]))
        ) or 0
        
        if enrollments_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot update class details - active enrollments exist. Renew without updates or wait until all sessions complete.",
            )
    
    # Extend expiry
    group_class.expires_on = payload.new_expiry_date
    group_class.expired_action_taken = "renewed"
    
    await db.commit()
    await db.refresh(group_class)
    
    return await _build_class_out(group_class, db)


@router.get("/me/tier-limits", response_model=TierLimitsResponse)
async def get_my_tier_limits(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    Get current tier limits and usage statistics.
    
    Shows:
    - Current tier (free/pro/elite/celeb)
    - Max active classes and sessions per month
    - Current usage counts
    - Upgrade availability
    """
    professional = await _require_professional(current_user, db)
    
    # Get tier from active subscription
    tier_result = await db.execute(
        select(SubscriptionPlan.tier)
        .join(ProfessionalSubscription, ProfessionalSubscription.plan_id == SubscriptionPlan.id)
        .where(
            ProfessionalSubscription.professional_id == professional.user_id,
            ProfessionalSubscription.status.in_(["active", "grace"]),
        )
    )
    tier_name = tier_result.scalar_one_or_none() or "free"
    
    usage_data = await get_tier_usage(db, professional.user_id, tier_name)
    return usage_data
