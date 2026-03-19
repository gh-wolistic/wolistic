"""Professional profile API routes."""

from __future__ import annotations

import uuid
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Float, case, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.booking import BookingQuestionTemplate
from app.models.professional import (
    Professional,
    ProfessionalApproach,
    ProfessionalAvailability,
    ProfessionalCertification,
    ProfessionalEducation,
    ProfessionalExpertiseArea,
    ProfessionalGallery,
    ProfessionalLanguage,
    ProfessionalReview,
    ProfessionalService,
    ProfessionalSessionType,
    ProfessionalSubcategory,
)
from app.services.ai.professional_search import rank_professional_profiles
from app.schemas.professional import (
    CertificationOut,
    ProfessionalEditorOut,
    ProfessionalEditorPayload,
    ProfessionalProfileOut,
    ProfessionalUsernameOut,
    ReviewOut,
    ReviewPageOut,
    ServiceOut,
)

router = APIRouter(prefix="/professionals", tags=["professionals"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _fmt_time(t: time) -> str:
    hour = t.hour
    suffix = "AM" if hour < 12 else "PM"
    display = hour % 12 or 12
    if t.minute:
        return f"{display}:{t.minute:02d} {suffix}"
    return f"{display} {suffix}"


def _derive_availability_string(slots: list) -> str | None:
    if not slots:
        return None
    days = sorted({s.day_of_week for s in slots})
    if not days:
        return None
    # Day range
    if len(days) == 7:
        day_str = "Every day"
    elif days == list(range(days[0], days[-1] + 1)):
        day_str = f"{_DAY_NAMES[days[0]]} - {_DAY_NAMES[days[-1]]}"
    else:
        day_str = ", ".join(_DAY_NAMES[d] for d in days)
    # Use the first slot's time range as representative
    start = slots[0].start_time
    end = slots[0].end_time
    return f"{day_str}, {_fmt_time(start)} - {_fmt_time(end)}"


async def _has_professional_education_table(db: AsyncSession) -> bool:
    result = await db.execute(select(func.to_regclass("public.professional_education")))
    return result.scalar_one_or_none() is not None


def _professional_load_options(*, include_education: bool) -> list:
    options = [
        selectinload(Professional.approaches),
        selectinload(Professional.availability_slots),
        selectinload(Professional.certifications),
        selectinload(Professional.expertise_areas),
        selectinload(Professional.gallery),
        selectinload(Professional.languages),
        selectinload(Professional.services),
        selectinload(Professional.session_types),
        selectinload(Professional.subcategories),
    ]
    if include_education:
        options.append(selectinload(Professional.education_items))
    return options


def _flatten_professional(prof: Professional) -> dict:
    """Convert ORM model with eagerly-loaded relationships to a flat dict."""
    yrs = prof.experience_years
    last_seen = prof.last_active_at
    is_online = bool(
        last_seen
        and last_seen >= (datetime.now(timezone.utc) - timedelta(minutes=5))
    )
    return {
        "id": prof.user_id,
        "username": prof.username,
        "name": prof.user.full_name or prof.username,
        "specialization": prof.specialization,
        "category": prof.subcategories[0].name if prof.subcategories else prof.specialization,
        "location": prof.location,
        "image": prof.profile_image_url,
        "cover_image": prof.cover_image_url,
        "rating": float(prof.rating_avg) if prof.rating_avg is not None else 0,
        "review_count": prof.rating_count,
        "experience": f"{yrs}+ years" if yrs else None,
        "experience_years": yrs,
        "short_bio": prof.short_bio,
        "about": prof.about,
        "membership_tier": prof.membership_tier,
        "is_online": is_online,
        # Flattened children
        "approach": " ".join(
            a.description or a.title for a in prof.approaches
        ) if prof.approaches else None,
        "availability": _derive_availability_string(prof.availability_slots),
        "certifications": [
            CertificationOut(
                name=c.name,
                issuer=c.issuer,
                issued_year=c.issued_year,
            )
            for c in prof.certifications
        ],
        "specializations": [e.title for e in prof.expertise_areas],
        "education": [item.education for item in getattr(prof, "education_items", [])],
        "languages": [lang.language for lang in prof.languages],
        "session_types": [s.session_type for s in prof.session_types],
        "subcategories": [s.name for s in prof.subcategories],
        "gallery": [
            g.image_url
            for g in sorted(prof.gallery, key=lambda g: g.display_order)
        ],
        "services": [
            ServiceOut(
                name=s.name,
                duration=f"{s.duration_value} {s.duration_unit}",
                mode=s.mode,
                price=int(s.price),
                offers=s.offers,
                negotiable=s.negotiable,
                offer_type="percentage" if s.offer_type == "percent" else s.offer_type,
                offer_value=s.offer_value,
                offer_label=s.offer_label,
            )
            for s in prof.services
            if s.is_active
        ],
        "featured_products": [],  # table does not exist yet
    }


def _sanitize_string_list(items: list[str]) -> list[str]:
    cleaned: list[str] = []
    for item in items:
        value = item.strip()
        if value:
            cleaned.append(value)
    return cleaned


def _normalize_duration_unit(value: str) -> str:
    unit = (value or "").strip().lower()
    if unit in {"min", "mins", "minute", "minutes"}:
        return "mins"
    if unit in {"hour", "hours", "hr", "hrs"}:
        return "hours"
    if unit in {"day", "days"}:
        return "days"
    return "mins"


def _to_editor_payload(prof: Professional) -> dict:
    return {
        "professional_id": prof.user_id,
        "username": prof.username,
        "cover_image_url": prof.cover_image_url,
        "profile_image_url": prof.profile_image_url,
        "specialization": prof.specialization,
        "membership_tier": prof.membership_tier,
        "experience_years": prof.experience_years,
        "location": prof.location,
        "sex": prof.sex,
        "short_bio": prof.short_bio,
        "about": prof.about,
        "approaches": [
            {"title": item.title, "description": item.description}
            for item in prof.approaches
        ],
        "availability_slots": [
            {
                "day_of_week": slot.day_of_week,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "timezone": slot.timezone,
            }
            for slot in prof.availability_slots
        ],
        "certifications": [
            {
                "name": cert.name,
                "issuer": cert.issuer,
                "issued_year": cert.issued_year,
            }
            for cert in prof.certifications
        ],
        "education": [item.education for item in getattr(prof, "education_items", [])],
        "expertise_areas": [
            {"title": area.title, "description": area.description}
            for area in prof.expertise_areas
        ],
        "gallery": [
            {
                "image_url": image.image_url,
                "caption": image.caption,
                "display_order": image.display_order,
            }
            for image in sorted(prof.gallery, key=lambda img: img.display_order)
        ],
        "languages": [lang.language for lang in prof.languages],
        "session_types": [item.session_type for item in prof.session_types],
        "subcategories": [item.name for item in prof.subcategories],
        "services": [
            {
                "name": service.name,
                "short_brief": service.short_brief,
                "price": float(service.price),
                "offers": service.offers,
                "negotiable": service.negotiable,
                "offer_type": service.offer_type,
                "offer_value": service.offer_value,
                "offer_label": service.offer_label,
                "offer_starts_at": service.offer_starts_at,
                "offer_ends_at": service.offer_ends_at,
                "mode": service.mode,
                "duration_value": service.duration_value,
                "duration_unit": service.duration_unit,
                "is_active": service.is_active,
            }
            for service in prof.services
        ],
    }


async def _replace_professional_children(
    *,
    db: AsyncSession,
    professional_id: uuid.UUID,
    payload: ProfessionalEditorPayload,
    include_education: bool,
) -> None:
    await db.execute(delete(ProfessionalApproach).where(ProfessionalApproach.professional_id == professional_id))
    await db.execute(
        delete(ProfessionalAvailability).where(ProfessionalAvailability.professional_id == professional_id)
    )
    await db.execute(
        delete(ProfessionalCertification).where(ProfessionalCertification.professional_id == professional_id)
    )
    await db.execute(
        delete(ProfessionalExpertiseArea).where(ProfessionalExpertiseArea.professional_id == professional_id)
    )
    await db.execute(delete(ProfessionalGallery).where(ProfessionalGallery.professional_id == professional_id))
    await db.execute(delete(ProfessionalLanguage).where(ProfessionalLanguage.professional_id == professional_id))
    await db.execute(
        delete(ProfessionalSessionType).where(ProfessionalSessionType.professional_id == professional_id)
    )
    await db.execute(delete(ProfessionalSubcategory).where(ProfessionalSubcategory.professional_id == professional_id))
    await db.execute(delete(ProfessionalService).where(ProfessionalService.professional_id == professional_id))
    if include_education:
        await db.execute(delete(ProfessionalEducation).where(ProfessionalEducation.professional_id == professional_id))

    for item in payload.approaches:
        db.add(
            ProfessionalApproach(
                professional_id=professional_id,
                title=item.title.strip(),
                description=item.description.strip() if item.description else None,
            )
        )

    for slot in payload.availability_slots:
        db.add(
            ProfessionalAvailability(
                professional_id=professional_id,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time,
                end_time=slot.end_time,
                timezone=slot.timezone.strip(),
            )
        )

    for cert in payload.certifications:
        db.add(
            ProfessionalCertification(
                professional_id=professional_id,
                name=cert.name.strip(),
                issuer=cert.issuer.strip() if cert.issuer else None,
                issued_year=cert.issued_year,
            )
        )

    if include_education:
        for education in _sanitize_string_list(payload.education):
            db.add(
                ProfessionalEducation(
                    professional_id=professional_id,
                    education=education,
                )
            )

    for area in payload.expertise_areas:
        db.add(
            ProfessionalExpertiseArea(
                professional_id=professional_id,
                title=area.title.strip(),
                description=area.description.strip() if area.description else None,
            )
        )

    for image in sorted(payload.gallery, key=lambda item: item.display_order):
        db.add(
            ProfessionalGallery(
                professional_id=professional_id,
                image_url=image.image_url.strip(),
                caption=image.caption.strip() if image.caption else None,
                display_order=image.display_order,
            )
        )

    for language in _sanitize_string_list(payload.languages):
        db.add(ProfessionalLanguage(professional_id=professional_id, language=language))

    for session_type in _sanitize_string_list(payload.session_types):
        db.add(ProfessionalSessionType(professional_id=professional_id, session_type=session_type))

    for subcategory in _sanitize_string_list(payload.subcategories):
        db.add(ProfessionalSubcategory(professional_id=professional_id, name=subcategory))

    for service in payload.services:
        db.add(
            ProfessionalService(
                professional_id=professional_id,
                name=service.name.strip(),
                short_brief=service.short_brief.strip() if service.short_brief else None,
                price=service.price,
                offers=service.offers.strip() if service.offers else None,
                negotiable=service.negotiable,
                offer_type=service.offer_type.strip().lower(),
                offer_value=service.offer_value,
                offer_label=service.offer_label.strip() if service.offer_label else None,
                offer_starts_at=service.offer_starts_at,
                offer_ends_at=service.offer_ends_at,
                mode=service.mode.strip(),
                duration_value=service.duration_value,
                duration_unit=_normalize_duration_unit(service.duration_unit),
                is_active=service.is_active,
            )
        )

    await db.execute(delete(BookingQuestionTemplate).where(BookingQuestionTemplate.professional_id == professional_id))
    ordered_questions = sorted(
        payload.booking_question_templates,
        key=lambda item: item.display_order,
    )
    for index, template in enumerate(ordered_questions, start=1):
        db.add(
            BookingQuestionTemplate(
                professional_id=professional_id,
                prompt=template.prompt.strip(),
                display_order=index,
                is_required=template.is_required,
                is_active=template.is_active,
            )
        )


# ---------------------------------------------------------------------------
# Endpoints — static-prefix routes FIRST, then catch-all /{username} LAST
# ---------------------------------------------------------------------------

@router.get("/by-id/{professional_id}", response_model=ProfessionalUsernameOut)
async def get_professional_username_by_id(
    professional_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalUsernameOut:
    """Return the username for a given professional UUID (used for redirects)."""
    result = await db.execute(
        select(Professional.username).where(Professional.user_id == professional_id)
    )
    username = result.scalar_one_or_none()
    if username is None:
        raise HTTPException(status_code=404, detail="Professional not found")
    return ProfessionalUsernameOut(username=username)


@router.get("/featured", response_model=list[ProfessionalProfileOut])
async def get_featured_professionals(
    limit: int = Query(default=8, ge=1, le=8),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProfessionalProfileOut]:
    """Return featured professionals using a simple score-based recommendation."""
    tier_bonus = case(
        (Professional.membership_tier == "premium", 0.30),
        (Professional.membership_tier == "verified", 0.15),
        else_=0.0,
    )
    online_bonus = case((Professional.is_online.is_(True), 0.20), else_=0.0)

    featured_score = (
        (func.coalesce(Professional.rating_avg, 0).cast(Float) * 0.70)
        + (func.least(func.coalesce(Professional.rating_count, 0), 100) * 0.01)
        + tier_bonus
        + online_bonus
    )

    result = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=False))
        .order_by(
            featured_score.desc(),
            Professional.rating_count.desc(),
            Professional.created_at.desc(),
        )
        .limit(limit)
    )
    professionals = result.scalars().all()

    return [ProfessionalProfileOut(**_flatten_professional(prof)) for prof in professionals]


@router.get("/search", response_model=list[ProfessionalProfileOut])
async def search_professionals(
    q: str = Query(default="", max_length=200),
    limit: int = Query(default=24, ge=1, le=60),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProfessionalProfileOut]:
    """Search professionals by query across identity, specialization, and expertise signals."""
    result = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=False))
        .order_by(Professional.rating_avg.desc(), Professional.rating_count.desc())
        .limit(250)
    )
    professionals = result.scalars().all()
    flattened = [_flatten_professional(prof) for prof in professionals]
    ranked = rank_professional_profiles(flattened, q, limit=limit)

    return [ProfessionalProfileOut(**profile) for profile in ranked]


@router.get("/{professional_id}/reviews", response_model=ReviewPageOut)
async def get_professional_reviews(
    professional_id: uuid.UUID,
    limit: int = Query(default=3, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db_session),
) -> ReviewPageOut:
    """Fetch paginated reviews for a professional."""
    count_result = await db.execute(
        select(func.count()).select_from(ProfessionalReview).where(
            ProfessionalReview.professional_id == professional_id
        )
    )
    total = count_result.scalar_one()

    items_result = await db.execute(
        select(ProfessionalReview)
        .where(ProfessionalReview.professional_id == professional_id)
        .order_by(ProfessionalReview.created_at.desc())
        .offset(offset)
        .limit(limit)
        .options(selectinload(ProfessionalReview.reviewer))
    )
    reviews = items_result.scalars().all()

    return ReviewPageOut(
        items=[
            ReviewOut(
                id=r.id,
                reviewer_name=r.reviewer.full_name or "Anonymous",
                rating=r.rating,
                comment=r.review_text,
                created_at=r.created_at.isoformat(),
            )
            for r in reviews
        ],
        total=total,
    )


@router.get("/me/editor", response_model=ProfessionalEditorOut)
async def get_my_professional_editor_payload(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalEditorOut:
    include_education = await _has_professional_education_table(db)
    result = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.user_id == current_user.user_id)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional profile not found for current user",
        )

    templates_result = await db.execute(
        select(BookingQuestionTemplate)
        .where(BookingQuestionTemplate.professional_id == current_user.user_id)
        .order_by(BookingQuestionTemplate.display_order.asc(), BookingQuestionTemplate.id.asc())
    )
    templates = templates_result.scalars().all()

    payload = _to_editor_payload(prof)
    payload["booking_question_templates"] = [
        {
            "prompt": template.prompt,
            "display_order": template.display_order,
            "is_required": template.is_required,
            "is_active": template.is_active,
        }
        for template in templates
    ]
    return ProfessionalEditorOut(**payload)


@router.put("/me/editor", response_model=ProfessionalEditorOut)
async def update_my_professional_editor_payload(
    payload: ProfessionalEditorPayload,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalEditorOut:
    include_education = await _has_professional_education_table(db)
    result = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.user_id == current_user.user_id)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional profile not found for current user",
        )

    prof.username = payload.username.strip()
    prof.cover_image_url = payload.cover_image_url.strip() if payload.cover_image_url else None
    prof.profile_image_url = payload.profile_image_url.strip() if payload.profile_image_url else None
    prof.specialization = payload.specialization.strip()
    prof.membership_tier = payload.membership_tier.strip() if payload.membership_tier else None
    prof.experience_years = payload.experience_years
    prof.location = payload.location.strip() if payload.location else None
    prof.sex = payload.sex.strip()
    prof.short_bio = payload.short_bio.strip() if payload.short_bio else None
    prof.about = payload.about.strip() if payload.about else None

    await _replace_professional_children(
        db=db,
        professional_id=current_user.user_id,
        payload=payload,
        include_education=include_education,
    )
    await db.commit()

    refreshed = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.user_id == current_user.user_id)
    )
    refreshed_prof = refreshed.scalar_one_or_none()
    if refreshed_prof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional profile not found after update",
        )

    templates_result = await db.execute(
        select(BookingQuestionTemplate)
        .where(BookingQuestionTemplate.professional_id == current_user.user_id)
        .order_by(BookingQuestionTemplate.display_order.asc(), BookingQuestionTemplate.id.asc())
    )
    templates = templates_result.scalars().all()

    out = _to_editor_payload(refreshed_prof)
    out["booking_question_templates"] = [
        {
            "prompt": template.prompt,
            "display_order": template.display_order,
            "is_required": template.is_required,
            "is_active": template.is_active,
        }
        for template in templates
    ]
    return ProfessionalEditorOut(**out)


@router.get("/{username}", response_model=ProfessionalProfileOut)
async def get_professional_by_username(
    username: str,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalProfileOut:
    """Fetch a full professional profile by username (slug)."""
    include_education = await _has_professional_education_table(db)
    result = await db.execute(
        select(Professional)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.username == username)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=404, detail="Professional not found")
    return ProfessionalProfileOut(**_flatten_professional(prof))
