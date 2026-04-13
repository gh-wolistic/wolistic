from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from app.models.professional import Professional
from app.schemas.professional import ApproachOut, CertificationOut, ExpertiseAreaOut, ServiceOut
from app.services.media_urls import to_public_profile_media_url

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

    if len(days) == 7:
        day_str = "Every day"
    elif days == list(range(days[0], days[-1] + 1)):
        day_str = f"{_DAY_NAMES[days[0]]} - {_DAY_NAMES[days[-1]]}"
    else:
        day_str = ", ".join(_DAY_NAMES[d] for d in days)

    start = slots[0].start_time
    end = slots[0].end_time
    return f"{day_str}, {_fmt_time(start)} - {_fmt_time(end)}"


def flatten_professional(prof: Professional) -> dict:
    """Convert ORM professional with loaded relationships to API shape."""
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
        "image": to_public_profile_media_url(prof.profile_image_url),
        "cover_image": to_public_profile_media_url(prof.cover_image_url),
        "rating": float(prof.rating_avg) if prof.rating_avg is not None else 0,
        "review_count": prof.rating_count,
        "experience": f"{yrs}+ years" if yrs else None,
        "experience_years": yrs,
        "short_bio": prof.short_bio,
        "about": prof.about,
        "membership_tier": prof.membership_tier,
        "profile_completeness": int(prof.profile_completeness or 0),
        "is_online": is_online,
        "pronouns": prof.pronouns,
        "who_i_work_with": prof.who_i_work_with,
        "client_goals": list(prof.client_goals) if prof.client_goals else [],
        "response_time_hours": int(prof.response_time_hours or 24),
        "cancellation_hours": int(prof.cancellation_hours or 24),
        "social_links": dict(prof.social_links) if prof.social_links else {},
        "video_intro_url": prof.video_intro_url,
        "approaches": [
            ApproachOut(title=a.title, description=a.description)
            for a in prof.approaches
        ],
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
        "expertise_areas": [
            ExpertiseAreaOut(title=e.title, description=e.description)
            for e in prof.expertise_areas
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
                session_count=s.session_count if s.session_count is not None else 1,
                offers=s.offers,
                negotiable=s.negotiable,
                offer_type="percentage" if s.offer_type == "percent" else s.offer_type,
                offer_value=s.offer_value,
                offer_label=s.offer_label,
            )
            for s in prof.services
            if s.is_active
        ],
        "service_areas": [
            {
                "city_name": area.city_name,
                "latitude": float(area.latitude) if area.latitude is not None else None,
                "longitude": float(area.longitude) if area.longitude is not None else None,
                "radius_km": area.radius_km,
                "is_primary": area.is_primary,
            }
            for area in prof.service_areas
        ],
        "featured_products": [],
    }