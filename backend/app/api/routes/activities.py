from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user, require_admin_api_key
from app.core.database import get_db_session
from app.models.activity import (
    PartnerActivity,
    PartnerInternalActivityStatus,
    WolisticActivityTemplate,
)
from app.models.booking import Booking
from app.models.professional import Professional
from app.models.user import User
from app.schemas.activity import (
    ActivityBoardOut,
    BookingBoardItemOut,
    BookingStatusUpdateIn,
    InternalActivityOut,
    InternalStatusUpdateIn,
    PartnerActivityIn,
    PartnerActivityOut,
    PartnerActivityUpdateIn,
    WolisticAssignmentOut,
    WolisticTemplateIn,
    WolisticTemplateOut,
)

router = APIRouter(prefix="/partners", tags=["activities"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_BOOKING_STATUS_MAP = {
    "pending": "yet-to-start",
    "confirmed": "accepted",
    "completed": "completed",
    "cancelled": "rejected",
}

# Allowed frontend-status → DB-status transitions per current DB status.
_BOOKING_TRANSITIONS: dict[str, dict[str, str]] = {
    "pending": {"accepted": "confirmed", "rejected": "cancelled"},
    "confirmed": {"completed": "completed"},
}


def _initials(name: str) -> str:
    parts = name.strip().split()
    return "".join(p[0].upper() for p in parts[:2]) or "??"


def _fmt_time(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.strftime("%I:%M %p")


def _fmt_date(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.date().isoformat()


# ---------------------------------------------------------------------------
# GET board
# ---------------------------------------------------------------------------


@router.get("/me/activity-board", response_model=ActivityBoardOut)
async def get_activity_board(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ActivityBoardOut:
    # 1. Partner todos
    todos_result = await db.execute(
        select(PartnerActivity)
        .where(PartnerActivity.professional_id == current_user.user_id)
        .order_by(PartnerActivity.created_at.desc())
    )
    todos = todos_result.scalars().all()

    # 2. Bookings — all pending/confirmed + recent completed/cancelled (last 7 days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    bookings_result = await db.execute(
        select(
            Booking.booking_reference,
            Booking.service_name,
            Booking.scheduled_for,
            Booking.status,
            Booking.created_at,
            User.full_name,
        )
        .outerjoin(User, User.id == Booking.client_user_id)
        .where(
            Booking.professional_id == current_user.user_id,
            or_(
                Booking.status.in_(["pending", "confirmed"]),
                and_(
                    Booking.status.in_(["completed", "cancelled"]),
                    Booking.created_at >= cutoff,
                ),
            ),
        )
        .order_by(Booking.scheduled_for.asc().nullslast(), Booking.created_at.desc())
        .limit(50)
    )
    booking_rows = bookings_result.all()

    # 3. Active Wolistic templates with partner's current status
    templates_result = await db.execute(
        select(
            WolisticActivityTemplate.id,
            WolisticActivityTemplate.title,
            WolisticActivityTemplate.description,
            WolisticActivityTemplate.category,
            WolisticActivityTemplate.priority,
            PartnerInternalActivityStatus.status,
        )
        .outerjoin(
            PartnerInternalActivityStatus,
            and_(
                PartnerInternalActivityStatus.template_id == WolisticActivityTemplate.id,
                PartnerInternalActivityStatus.professional_id == current_user.user_id,
            ),
        )
        .where(WolisticActivityTemplate.is_active.is_(True))
        .order_by(WolisticActivityTemplate.id)
    )
    template_rows = templates_result.all()

    return ActivityBoardOut(
        todos=[
            PartnerActivityOut(
                id=t.id,
                title=t.title,
                description=t.description,
                status=t.status,
                priority=t.priority,
                due_date=t.due_date,
                created_at=t.created_at,
            )
            for t in todos
        ],
        bookings=[
            BookingBoardItemOut(
                booking_reference=row.booking_reference,
                client_name=row.full_name or "Client",
                client_initials=_initials(row.full_name or "Client"),
                service_name=row.service_name,
                scheduled_time=_fmt_time(row.scheduled_for),
                scheduled_date=_fmt_date(row.scheduled_for),
                status=_BOOKING_STATUS_MAP.get(row.status, "yet-to-start"),
                created_at=row.created_at,
            )
            for row in booking_rows
        ],
        internal=[
            InternalActivityOut(
                template_id=row.id,
                title=row.title,
                description=row.description,
                category=row.category,
                priority=row.priority,
                status=row.status or "yet-to-start",
            )
            for row in template_rows
        ],
    )


# ---------------------------------------------------------------------------
# Todos CRUD
# ---------------------------------------------------------------------------


@router.post("/me/activities", response_model=PartnerActivityOut, status_code=201)
async def create_activity(
    body: PartnerActivityIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerActivityOut:
    activity = PartnerActivity(
        professional_id=current_user.user_id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return PartnerActivityOut(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        status=activity.status,
        priority=activity.priority,
        due_date=activity.due_date,
        created_at=activity.created_at,
    )


@router.patch("/me/activities/{activity_id}", response_model=PartnerActivityOut)
async def update_activity(
    activity_id: int,
    body: PartnerActivityUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerActivityOut:
    result = await db.execute(
        select(PartnerActivity).where(
            PartnerActivity.id == activity_id,
            PartnerActivity.professional_id == current_user.user_id,
        )
    )
    activity = result.scalar_one_or_none()
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    if body.title is not None:
        activity.title = body.title
    if body.description is not None:
        activity.description = body.description
    if body.status is not None:
        activity.status = body.status
    if body.priority is not None:
        activity.priority = body.priority
    if body.due_date is not None:
        activity.due_date = body.due_date

    await db.commit()
    await db.refresh(activity)
    return PartnerActivityOut(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        status=activity.status,
        priority=activity.priority,
        due_date=activity.due_date,
        created_at=activity.created_at,
    )


@router.delete("/me/activities/{activity_id}", status_code=204, response_model=None)
async def delete_activity(
    activity_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await db.execute(
        select(PartnerActivity).where(
            PartnerActivity.id == activity_id,
            PartnerActivity.professional_id == current_user.user_id,
        )
    )
    activity = result.scalar_one_or_none()
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    await db.delete(activity)
    await db.commit()
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# Booking status update (partner-scoped)
# ---------------------------------------------------------------------------


@router.patch("/me/bookings/{booking_reference}/status")
async def update_booking_status(
    booking_reference: str,
    body: BookingStatusUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.execute(
        select(Booking).where(
            Booking.booking_reference == booking_reference,
            Booking.professional_id == current_user.user_id,
        )
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    allowed_transitions = _BOOKING_TRANSITIONS.get(booking.status, {})
    if body.status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot move booking from '{booking.status}' to '{body.status}'",
        )

    booking.status = allowed_transitions[body.status]
    await db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Internal activity status update (upsert)
# ---------------------------------------------------------------------------


@router.patch("/me/internal-activities/{template_id}")
async def update_internal_activity_status(
    template_id: int,
    body: InternalStatusUpdateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    # Verify template exists
    tmpl_result = await db.execute(
        select(WolisticActivityTemplate).where(WolisticActivityTemplate.id == template_id)
    )
    if tmpl_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    result = await db.execute(
        select(PartnerInternalActivityStatus).where(
            PartnerInternalActivityStatus.professional_id == current_user.user_id,
            PartnerInternalActivityStatus.template_id == template_id,
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        record = PartnerInternalActivityStatus(
            professional_id=current_user.user_id,
            template_id=template_id,
            status=body.status,
        )
        db.add(record)
    else:
        record.status = body.status
    await db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Admin: Wolistic template CRUD
# ---------------------------------------------------------------------------


@router.get("/admin/activity-templates", response_model=list[WolisticTemplateOut], tags=["admin"])
async def list_activity_templates(
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
) -> list[WolisticTemplateOut]:
    result = await db.execute(
        select(WolisticActivityTemplate).order_by(WolisticActivityTemplate.id)
    )
    templates = result.scalars().all()
    return [
        WolisticTemplateOut(
            id=t.id,
            title=t.title,
            description=t.description,
            category=t.category,
            priority=t.priority,
            applies_to_subtype=t.applies_to_subtype,
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in templates
    ]


@router.post(
    "/admin/activity-templates",
    response_model=WolisticTemplateOut,
    status_code=201,
    tags=["admin"],
)
async def create_activity_template(
    body: WolisticTemplateIn,
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
) -> WolisticTemplateOut:
    template = WolisticActivityTemplate(
        title=body.title,
        description=body.description,
        category=body.category,
        priority=body.priority,
        applies_to_subtype=body.applies_to_subtype,
        is_active=body.is_active,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return WolisticTemplateOut(
        id=template.id,
        title=template.title,
        description=template.description,
        category=template.category,
        priority=template.priority,
        applies_to_subtype=template.applies_to_subtype,
        is_active=template.is_active,
        created_at=template.created_at,
    )


@router.patch(
    "/admin/activity-templates/{template_id}",
    response_model=WolisticTemplateOut,
    tags=["admin"],
)
async def update_activity_template(
    template_id: int,
    body: WolisticTemplateIn,
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
) -> WolisticTemplateOut:
    result = await db.execute(
        select(WolisticActivityTemplate).where(WolisticActivityTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    template.title = body.title
    template.description = body.description
    template.category = body.category
    template.priority = body.priority
    template.applies_to_subtype = body.applies_to_subtype
    template.is_active = body.is_active
    await db.commit()
    await db.refresh(template)
    return WolisticTemplateOut(
        id=template.id,
        title=template.title,
        description=template.description,
        category=template.category,
        priority=template.priority,
        applies_to_subtype=template.applies_to_subtype,
        is_active=template.is_active,
        created_at=template.created_at,
    )


@router.delete("/admin/activity-templates/{template_id}", status_code=204, response_model=None, tags=["admin"])
async def delete_activity_template(
    template_id: int,
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await db.execute(
        select(WolisticActivityTemplate).where(WolisticActivityTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await db.delete(template)
    await db.commit()
    return Response(status_code=204)


@router.get(
    "/admin/activity-templates/{template_id}/assignments",
    response_model=list[WolisticAssignmentOut],
    tags=["admin"],
)
async def list_template_assignments(
    template_id: int,
    _: None = Depends(require_admin_api_key),
    db: AsyncSession = Depends(get_db_session),
) -> list[WolisticAssignmentOut]:
    """Return all professionals who have a status row for this template."""
    rows = await db.execute(
        select(
            PartnerInternalActivityStatus.professional_id,
            PartnerInternalActivityStatus.status,
            User.full_name,
            User.email,
            Professional.username,
        )
        .join(User, User.id == PartnerInternalActivityStatus.professional_id)
        .join(Professional, Professional.user_id == PartnerInternalActivityStatus.professional_id)
        .where(PartnerInternalActivityStatus.template_id == template_id)
        .order_by(User.full_name)
    )
    return [
        WolisticAssignmentOut(
            professional_id=str(row.professional_id),
            full_name=row.full_name,
            email=row.email,
            username=row.username,
            status=row.status,
        )
        for row in rows.all()
    ]
