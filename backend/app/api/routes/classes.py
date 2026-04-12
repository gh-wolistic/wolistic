from __future__ import annotations

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.classes import ClassEnrollment, ClassSession, GroupClass, WorkLocation
from app.models.professional import Professional
from app.schemas.classes import (
    ClassEnrollmentIn,
    ClassEnrollmentOut,
    ClassEnrollmentPatch,
    ClassSessionIn,
    ClassSessionOut,
    GroupClassIn,
    GroupClassOut,
    GroupClassPatch,
    SessionScheduleOut,
    WorkLocationIn,
    WorkLocationOut,
)

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
            enrolled_count=enrolled_count,
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
    if cls_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    session = ClassSession(
        group_class_id=class_id,
        session_date=payload.session_date,
        start_time=payload.start_time,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return ClassSessionOut(
        id=session.id,
        group_class_id=session.group_class_id,
        session_date=session.session_date,
        start_time=session.start_time,
        enrolled_count=0,
        created_at=session.created_at,
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
        client_name=enrollment.client_name,
        status=enrollment.status,
        payment_status=enrollment.payment_status,
        class_title=gc.title,
        session_date=s.session_date,
        start_time=s.start_time,
        work_location_name=loc_name,
        created_at=enrollment.created_at,
    )
