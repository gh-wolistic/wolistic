"""Professional profile API routes."""

from __future__ import annotations

import uuid
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.models.professional import Professional, ProfessionalReview
from app.schemas.professional import (
    CertificationOut,
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
        "education": [],
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
            )
            for s in prof.services
            if s.is_active
        ],
        "featured_products": [],  # table does not exist yet
    }


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


@router.get("/{username}", response_model=ProfessionalProfileOut)
async def get_professional_by_username(
    username: str,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalProfileOut:
    """Fetch a full professional profile by username (slug)."""
    result = await db.execute(
        select(Professional).where(Professional.username == username)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=404, detail="Professional not found")
    return ProfessionalProfileOut(**_flatten_professional(prof))
