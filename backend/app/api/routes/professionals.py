"""Professional profile API routes."""

from __future__ import annotations

import uuid
from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Float, and_, case, delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.booking import BookingQuestionTemplate
from app.models.professional import (
    Professional,
    ProfessionalApproach,
    ProfessionalAvailability,
    ProfessionalBoostImpression,
    ProfessionalCertification,
    ProfessionalEducation,
    ProfessionalExpertiseArea,
    ProfessionalGallery,
    ProfessionalLanguage,
    ProfessionalReview,
    ProfessionalServiceArea,
    ProfessionalService,
    ProfessionalSessionType,
    ProfessionalSubcategory,
)
from app.services.ai.professional_search import rank_professional_profiles
from app.services.geo import extract_known_cities, resolve_city_coordinates
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
_EARTH_RADIUS_KM = 6371.0
_FEATURED_ROLE_ORDER = ("mind", "body", "diet")
_BOOSTED_MEMBERSHIP_TIERS = {"premium", "elite"}
_BOOSTED_MIN_RATING = 4.3
_BOOSTED_MIN_REVIEWS = 20
_BOOSTED_TOP_OVERRIDE_GAP = 0.05
_RESULTS_BOOST_WINDOW = 8
_RESULTS_BOOST_MIN_RELEVANCE = 1
_RESULTS_BOOST_TOP_GAP = 0.10


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
        selectinload(Professional.service_areas),
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
        "featured_products": [],  # table does not exist yet
    }


def _haversine_distance_km_expr(*, latitude: float, longitude: float, lat_expr, lng_expr):
    """Return SQL expression for distance (km) from (latitude, longitude) to supplied coordinates."""
    cos_term = (
        func.cos(func.radians(latitude))
        * func.cos(func.radians(lat_expr))
        * func.cos(func.radians(lng_expr) - func.radians(longitude))
        + func.sin(func.radians(latitude))
        * func.sin(func.radians(lat_expr))
    )
    clamped = func.greatest(-1.0, func.least(1.0, cos_term))
    return _EARTH_RADIUS_KM * func.acos(clamped)


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


def _featured_text_blob(profile: dict) -> str:
    parts = [
        str(profile.get("specialization") or ""),
        str(profile.get("category") or ""),
        " ".join(str(item) for item in (profile.get("subcategories") or [])),
        " ".join(str(item) for item in (profile.get("specializations") or [])),
    ]
    raw = " ".join(parts).lower()
    return " ".join(raw.split())


def _tokenize_text(value: str | None) -> set[str]:
    if not value:
        return set()
    normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
    return {token for token in normalized.split() if token}


def _featured_role(profile: dict) -> str | None:
    text = _featured_text_blob(profile)

    mind_keywords = (
        "mind",
        "mental",
        "psych",
        "counsel",
        "therap",
        "meditation",
        "stress",
    )
    body_keywords = (
        "body",
        "fitness",
        "strength",
        "conditioning",
        "physio",
        "physiotherapy",
        "yoga",
        "mobility",
        "rehab",
    )
    diet_keywords = (
        "diet",
        "nutrition",
        "nutri",
        "dietitian",
        "meal",
        "gut",
        "ayurveda",
    )

    if any(keyword in text for keyword in mind_keywords):
        return "mind"
    if any(keyword in text for keyword in body_keywords):
        return "body"
    if any(keyword in text for keyword in diet_keywords):
        return "diet"
    return None


def _quality_score(profile: dict) -> float:
    tier = str(profile.get("membership_tier") or "").strip().lower()
    rating = float(profile.get("rating") or 0)
    reviews = int(profile.get("review_count") or 0)
    online = bool(profile.get("is_online"))

    tier_bonus = 0.30 if tier == "premium" else (0.20 if tier == "elite" else 0.0)
    online_bonus = 0.20 if online else 0.0
    return (rating * 0.70) + (min(reviews, 100) * 0.01) + tier_bonus + online_bonus


def _relevance_score(profile: dict, query: str) -> int:
    query_tokens = _tokenize_text(query)
    if not query_tokens:
        return 0

    profile_tokens = _tokenize_text(
        " ".join(
            [
                str(profile.get("name") or ""),
                str(profile.get("specialization") or ""),
                str(profile.get("category") or ""),
                " ".join(str(item) for item in (profile.get("subcategories") or [])),
                " ".join(str(item) for item in (profile.get("specializations") or [])),
            ]
        )
    )
    if not profile_tokens:
        return 0

    score = 0
    for token in query_tokens:
        if len(token) < 3:
            if token in profile_tokens:
                score += 1
            continue
        if any(token in candidate for candidate in profile_tokens):
            score += 1
    return score


def _has_usable_location(profile: dict) -> bool:
    service_areas = profile.get("service_areas") or []
    has_service_area_coords = any(
        area.get("latitude") is not None and area.get("longitude") is not None
        for area in service_areas
        if isinstance(area, dict)
    )
    return bool(profile.get("location")) or has_service_area_coords


def _is_boosted_eligible(profile: dict, *, allow_boosted_slot: bool) -> bool:
    if not allow_boosted_slot:
        return False

    tier = str(profile.get("membership_tier") or "").strip().lower()
    if tier not in _BOOSTED_MEMBERSHIP_TIERS:
        return False
    if not bool(profile.get("is_online")):
        return False
    if not _has_usable_location(profile):
        return False
    if float(profile.get("rating") or 0) < _BOOSTED_MIN_RATING:
        return False
    if int(profile.get("review_count") or 0) < _BOOSTED_MIN_REVIEWS:
        return False
    return True


def _build_diverse_organic_slice(profiles: list[dict], *, target_count: int) -> list[dict]:
    if target_count <= 0 or not profiles:
        return []

    chosen: list[dict] = []
    chosen_ids: set[str] = set()

    for role in _FEATURED_ROLE_ORDER:
        if len(chosen) >= target_count:
            break
        for profile in profiles:
            profile_id = str(profile.get("id"))
            if profile_id in chosen_ids:
                continue
            if _featured_role(profile) != role:
                continue
            chosen.append(profile)
            chosen_ids.add(profile_id)
            break

    for profile in profiles:
        if len(chosen) >= target_count:
            break
        profile_id = str(profile.get("id"))
        if profile_id in chosen_ids:
            continue
        chosen.append(profile)
        chosen_ids.add(profile_id)

    return chosen


def _apply_featured_card_strategy(
    ranked_profiles: list[dict],
    *,
    limit: int,
    allow_boosted_slot: bool,
) -> list[dict]:
    if limit <= 0 or not ranked_profiles:
        return []

    target_head = min(4, limit, len(ranked_profiles))
    boosted_candidate = next(
        (profile for profile in ranked_profiles if _is_boosted_eligible(profile, allow_boosted_slot=allow_boosted_slot)),
        None,
    )

    organic_pool = ranked_profiles
    if boosted_candidate is not None:
        boosted_id = str(boosted_candidate.get("id"))
        organic_pool = [profile for profile in ranked_profiles if str(profile.get("id")) != boosted_id]

    organic_target = target_head - (1 if boosted_candidate is not None else 0)
    head = _build_diverse_organic_slice(organic_pool, target_count=organic_target)

    if boosted_candidate is not None:
        boosted = {**boosted_candidate, "placement_label": "Boosted"}
        insert_at = 1 if head else 0

        if head:
            head_top_score = _quality_score(head[0])
            boosted_score = _quality_score(boosted)
            if head_top_score > 0 and ((head_top_score - boosted_score) / head_top_score) <= _BOOSTED_TOP_OVERRIDE_GAP:
                insert_at = 0

        insert_at = min(insert_at, 2, len(head))
        head.insert(insert_at, boosted)

    ordered: list[dict] = []
    used_ids: set[str] = set()

    for profile in head:
        profile_id = str(profile.get("id"))
        if profile_id in used_ids:
            continue
        ordered.append(profile)
        used_ids.add(profile_id)

    for profile in ranked_profiles:
        if len(ordered) >= limit:
            break
        profile_id = str(profile.get("id"))
        if profile_id in used_ids:
            continue
        ordered.append(profile)
        used_ids.add(profile_id)

    return ordered[:limit]


def _apply_results_boost_strategy(
    ranked_profiles: list[dict],
    *,
    query: str,
    limit: int,
) -> list[dict]:
    if limit <= 0 or not ranked_profiles:
        return []

    window = min(_RESULTS_BOOST_WINDOW, limit, len(ranked_profiles))
    top_window = ranked_profiles[:window]
    top_organic = top_window[0] if top_window else None
    if not top_organic:
        return ranked_profiles[:limit]

    top_organic_relevance = _relevance_score(top_organic, query)
    top_organic_combined = (top_organic_relevance * 10.0) + _quality_score(top_organic)

    boosted_candidate: dict | None = None
    for candidate in top_window:
        if not _is_boosted_eligible(candidate, allow_boosted_slot=True):
            continue
        candidate_relevance = _relevance_score(candidate, query)
        if candidate_relevance < _RESULTS_BOOST_MIN_RELEVANCE:
            continue
        if candidate_relevance < top_organic_relevance:
            continue

        candidate_combined = (candidate_relevance * 10.0) + _quality_score(candidate)
        if top_organic_combined > 0:
            relative_gap = (top_organic_combined - candidate_combined) / top_organic_combined
            if relative_gap > _RESULTS_BOOST_TOP_GAP:
                continue

        boosted_candidate = candidate
        break

    if not boosted_candidate:
        return ranked_profiles[:limit]

    boosted_id = str(boosted_candidate.get("id"))
    arranged_window = [item for item in top_window if str(item.get("id")) != boosted_id]
    boosted = {**boosted_candidate, "placement_label": "Boosted"}
    insert_index = 1 if len(arranged_window) >= 1 else 0
    arranged_window.insert(insert_index, boosted)

    arranged: list[dict] = []
    used_ids: set[str] = set()
    for item in arranged_window:
        item_id = str(item.get("id"))
        if item_id in used_ids:
            continue
        arranged.append(item)
        used_ids.add(item_id)

    for item in ranked_profiles:
        if len(arranged) >= limit:
            break
        item_id = str(item.get("id"))
        if item_id in used_ids:
            continue
        arranged.append(item)
        used_ids.add(item_id)

    return arranged[:limit]


async def _record_boost_impressions(
    *,
    db: AsyncSession,
    profiles: list[dict],
    surface: str,
    query_text: str | None = None,
    user_latitude: float | None = None,
    user_longitude: float | None = None,
    radius_km: float | None = None,
) -> None:
    boosted = [
        (index, profile)
        for index, profile in enumerate(profiles, start=1)
        if profile.get("placement_label") == "Boosted"
    ]
    if not boosted:
        return

    for slot_position, profile in boosted:
        professional_id = profile.get("id")
        if professional_id is None:
            continue
        db.add(
            ProfessionalBoostImpression(
                professional_id=professional_id,
                surface=surface,
                slot_position=slot_position,
                placement_label="Boosted",
                query_text=query_text,
                user_latitude=user_latitude,
                user_longitude=user_longitude,
                radius_km=int(radius_km) if radius_km is not None else None,
            )
        )

    try:
        await db.commit()
    except Exception:
        await db.rollback()


def _build_service_areas(payload: ProfessionalEditorPayload) -> list[dict]:
    areas: list[dict] = []

    for item in payload.service_areas:
        city = item.city_name.strip()
        if not city:
            continue

        resolved = resolve_city_coordinates(city)
        latitude = item.latitude if item.latitude is not None else (resolved.latitude if resolved else None)
        longitude = item.longitude if item.longitude is not None else (resolved.longitude if resolved else None)
        canonical_city = resolved.city_name if resolved else city

        areas.append(
            {
                "city_name": canonical_city,
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": item.radius_km,
                "is_primary": item.is_primary,
            }
        )

    if not areas and payload.location:
        resolved_locations = extract_known_cities(payload.location)
        if resolved_locations:
            for index, resolved_location in enumerate(resolved_locations):
                areas.append(
                    {
                        "city_name": resolved_location.city_name,
                        "latitude": resolved_location.latitude,
                        "longitude": resolved_location.longitude,
                        "radius_km": 300,
                        "is_primary": index == 0,
                    }
                )
        else:
            resolved_location = resolve_city_coordinates(payload.location)
            if resolved_location:
                areas.append(
                    {
                        "city_name": resolved_location.city_name,
                        "latitude": resolved_location.latitude,
                        "longitude": resolved_location.longitude,
                        "radius_km": 300,
                        "is_primary": True,
                    }
                )

    deduped: list[dict] = []
    seen: set[str] = set()
    for area in areas:
        key = area["city_name"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(area)

    if deduped and not any(area["is_primary"] for area in deduped):
        deduped[0]["is_primary"] = True

    return deduped


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
        "service_areas": [
            {
                "city_name": item.city_name,
                "latitude": float(item.latitude) if item.latitude is not None else None,
                "longitude": float(item.longitude) if item.longitude is not None else None,
                "radius_km": item.radius_km,
                "is_primary": item.is_primary,
            }
            for item in sorted(
                prof.service_areas,
                key=lambda area: (not area.is_primary, area.city_name.lower()),
            )
        ],
    }


async def _replace_professional_children(
    *,
    db: AsyncSession,
    professional_id: uuid.UUID,
    payload: ProfessionalEditorPayload,
    include_education: bool,
    service_areas: list[dict],
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
    await db.execute(delete(ProfessionalServiceArea).where(ProfessionalServiceArea.professional_id == professional_id))
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

    for area in service_areas:
        db.add(
            ProfessionalServiceArea(
                professional_id=professional_id,
                city_name=area["city_name"],
                latitude=area["latitude"],
                longitude=area["longitude"],
                radius_km=area["radius_km"],
                is_primary=area["is_primary"],
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
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float = Query(default=300, gt=0, le=3000),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProfessionalProfileOut]:
    """Return featured professionals with optional nearby filtering and nearest-location fallback."""
    if (lat is None) != (lng is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both lat and lng are required together.",
        )

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

    service_area_coordinates_exists = exists(
        select(1).where(
            ProfessionalServiceArea.professional_id == Professional.user_id,
            ProfessionalServiceArea.latitude.is_not(None),
            ProfessionalServiceArea.longitude.is_not(None),
        )
    )
    has_usable_coordinates = or_(
        and_(
            Professional.latitude.is_not(None),
            Professional.longitude.is_not(None),
        ),
        service_area_coordinates_exists,
    )

    # Hide profiles that cannot be placed on a map for nearby ranking.
    base_select = (
        select(Professional)
        .options(*_professional_load_options(include_education=False))
        .where(has_usable_coordinates)
    )

    # Attempt nearby-first ranking when coordinates are provided.
    if lat is not None and lng is not None:
        professional_distance_km = _haversine_distance_km_expr(
            latitude=lat,
            longitude=lng,
            lat_expr=Professional.latitude,
            lng_expr=Professional.longitude,
        )
        service_area_distance_km = _haversine_distance_km_expr(
            latitude=lat,
            longitude=lng,
            lat_expr=ProfessionalServiceArea.latitude,
            lng_expr=ProfessionalServiceArea.longitude,
        )
        min_service_area_distance_km = (
            select(func.min(service_area_distance_km))
            .where(
                ProfessionalServiceArea.professional_id == Professional.user_id,
                ProfessionalServiceArea.latitude.is_not(None),
                ProfessionalServiceArea.longitude.is_not(None),
            )
            .scalar_subquery()
        )

        effective_distance_km = func.least(
            func.coalesce(professional_distance_km, 1e9),
            func.coalesce(min_service_area_distance_km, 1e9),
        )
        nearby_result = await db.execute(
            base_select
            .where(
                effective_distance_km <= radius_km,
            )
            .order_by(
                effective_distance_km.asc(),
                featured_score.desc(),
                Professional.rating_count.desc(),
                Professional.created_at.desc(),
            )
            .limit(limit)
        )
        nearby_professionals = nearby_result.scalars().all()

        # If radius is empty, fall back to nearest known profiles by distance.
        if nearby_professionals:
            flattened = [_flatten_professional(prof) for prof in nearby_professionals]
            arranged = _apply_featured_card_strategy(
                flattened,
                limit=limit,
                allow_boosted_slot=True,
            )
            await _record_boost_impressions(
                db=db,
                profiles=arranged,
                surface="featured",
                user_latitude=lat,
                user_longitude=lng,
                radius_km=radius_km,
            )
            return [ProfessionalProfileOut(**profile) for profile in arranged]

        nearest_result = await db.execute(
            base_select
            .order_by(
                effective_distance_km.asc(),
                featured_score.desc(),
                Professional.rating_count.desc(),
                Professional.created_at.desc(),
            )
            .limit(limit)
        )
        nearest_professionals = nearest_result.scalars().all()

        flattened = [_flatten_professional(prof) for prof in nearest_professionals]
        arranged = _apply_featured_card_strategy(
            flattened,
            limit=limit,
            allow_boosted_slot=False,
        )
        await _record_boost_impressions(
            db=db,
            profiles=arranged,
            surface="featured",
            user_latitude=lat,
            user_longitude=lng,
            radius_km=radius_km,
        )
        return [ProfessionalProfileOut(**profile) for profile in arranged]

    result = await db.execute(
        base_select
        .order_by(
            featured_score.desc(),
            Professional.rating_count.desc(),
            Professional.created_at.desc(),
        )
        .limit(limit)
    )
    professionals = result.scalars().all()
    flattened = [_flatten_professional(prof) for prof in professionals]
    arranged = _apply_featured_card_strategy(
        flattened,
        limit=limit,
        allow_boosted_slot=True,
    )
    await _record_boost_impressions(
        db=db,
        profiles=arranged,
        surface="featured",
    )

    return [ProfessionalProfileOut(**profile) for profile in arranged]


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
    ranked = _apply_results_boost_strategy(ranked, query=q, limit=limit)
    await _record_boost_impressions(
        db=db,
        profiles=ranked,
        surface="results",
        query_text=q.strip() or None,
    )

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
    prof.sex = payload.sex.strip()
    prof.short_bio = payload.short_bio.strip() if payload.short_bio else None
    prof.about = payload.about.strip() if payload.about else None

    service_areas = _build_service_areas(payload)
    primary_area = next((item for item in service_areas if item["is_primary"]), None)
    fallback_location = payload.location.strip() if payload.location else None

    prof.location = primary_area["city_name"] if primary_area else fallback_location
    prof.latitude = primary_area["latitude"] if primary_area else None
    prof.longitude = primary_area["longitude"] if primary_area else None

    await _replace_professional_children(
        db=db,
        professional_id=current_user.user_id,
        payload=payload,
        include_education=include_education,
        service_areas=service_areas,
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
