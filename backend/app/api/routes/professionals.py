"""Professional profile API routes."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import Float, and_, case, delete, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings
from app.core.database import get_db_session
from app.services.coins import award_coins
from app.api.serializers.professional import flatten_professional as _flatten_professional
from app.models.booking import BookingQuestionTemplate
from app.models.professional import (
    Professional,
    ProfessionalApproach,
    ProfessionalAvailability,
    ProfessionalBoostImpression,
    ProfessionalCertification,
    ProfessionalFeaturedIndex,
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
from app.models.user import User
from app.services.media_urls import normalize_profile_media_path, to_public_profile_media_url
from app.services.ai.professional_search import rank_professional_profiles
from app.services.geo import extract_known_cities, resolve_city_coordinates
from app.schemas.professional import (
    ProfessionalEditorOut,
    ProfessionalEditorPayload,
    ProfessionalProfileOut,
    ProfessionalUsernameOut,
    PublishProfileOut,
    ReviewOut,
    ReviewPageOut,
)

router = APIRouter(prefix="/professionals", tags=["professionals"])
settings = get_settings()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_EARTH_RADIUS_KM = 6371.0
_FEATURED_ROLE_ORDER = ("mind", "body", "diet")
_BOOSTED_MEMBERSHIP_TIERS = {"premium", "elite"}
_BOOSTED_MIN_RATING = 4.3
_BOOSTED_MIN_REVIEWS = 20
_BOOSTED_TOP_OVERRIDE_GAP = 0.05
_RESULTS_BOOST_WINDOW = 8
_RESULTS_BOOST_MIN_RELEVANCE = 1
_RESULTS_BOOST_TOP_GAP = 0.10
_DISCOVERY_MIN_PROFILE_COMPLETENESS = settings.PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY
_DEFAULT_INITIAL_CONSULTATION_NAME = "Initial Consultation"
_DEFAULT_INITIAL_CONSULTATION_PRICE = 250


def _build_default_initial_consultation_service(*, professional_id: uuid.UUID) -> ProfessionalService:
    return ProfessionalService(
        professional_id=professional_id,
        name=_DEFAULT_INITIAL_CONSULTATION_NAME,
        short_brief="Intro consultation to understand your goals and next steps.",
        price=250,
        offers="100% refund as credits",
        negotiable=False,
        offer_type="cashback",
        offer_value=250,
        offer_label="100% refund as credits",
        mode="online",
        duration_value=15,
        duration_unit="mins",
        is_active=True,
    )


async def _ensure_default_initial_consultation_service(
    *,
    db: AsyncSession,
    professional_id: uuid.UUID,
) -> None:
    existing_service_result = await db.execute(
        select(ProfessionalService.id)
        .where(
            ProfessionalService.professional_id == professional_id,
            func.lower(func.trim(ProfessionalService.name))
            == func.lower(func.trim(_DEFAULT_INITIAL_CONSULTATION_NAME)),
        )
        .limit(1)
    )
    if existing_service_result.scalar_one_or_none() is not None:
        return

    db.add(_build_default_initial_consultation_service(professional_id=professional_id))


def _slugify_username_seed(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized[:40] if normalized else "expert"


async def _build_unique_professional_username(*, db: AsyncSession, seed: str) -> str:
    base = _slugify_username_seed(seed)
    candidate = base
    attempt = 1

    while True:
        exists_result = await db.execute(
            select(Professional.user_id).where(Professional.username == candidate)
        )
        if exists_result.scalar_one_or_none() is None:
            return candidate
        attempt += 1
        candidate = f"{base}-{attempt}"


async def _ensure_professional_for_current_user(
    *,
    db: AsyncSession,
    current_user: AuthenticatedUser,
) -> Professional:
    existing_result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing is not None:
        await _ensure_default_initial_consultation_service(
            db=db,
            professional_id=existing.user_id,
        )
        return existing

    user_result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user not found",
        )

    if user.user_type != "partner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only partner users can access professional editor",
        )

    username_seed = user.full_name or user.email.split("@")[0]
    username = await _build_unique_professional_username(db=db, seed=username_seed)

    professional = Professional(
        user_id=current_user.user_id,
        username=username,
        specialization="Wellness Professional",
    )
    db.add(professional)
    await _ensure_default_initial_consultation_service(
        db=db,
        professional_id=current_user.user_id,
    )
    await db.commit()
    await db.refresh(professional)
    return professional

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

def _compute_profile_completeness(*, professional: Professional) -> int:
    score_fields: list[bool] = [
        bool((professional.username or "").strip()),
        bool((professional.cover_image_url or "").strip()),
        bool((professional.profile_image_url or "").strip()),
        bool((professional.specialization or "").strip()),
        bool((professional.membership_tier or "").strip()),
        bool((professional.location or "").strip()),
        professional.experience_years is not None and professional.experience_years > 0,
        bool((professional.sex or "").strip()) and (professional.sex or "").strip().lower() != "undisclosed",
        bool((professional.short_bio or "").strip()),
        bool((professional.about or "").strip()),
        professional.latitude is not None,
        professional.longitude is not None,
    ]
    filled_count = sum(1 for value in score_fields if value)
    return int(round((filled_count / len(score_fields)) * 100))


def _discovery_filters() -> tuple:
    return (
        User.user_status == "verified",
        Professional.profile_completeness >= _DISCOVERY_MIN_PROFILE_COMPLETENESS,
    )


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


def _is_initial_consultation_name(value: str) -> bool:
    return value.strip().lower() == _DEFAULT_INITIAL_CONSULTATION_NAME.lower()


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


async def _load_featured_profiles_from_index(
    db: AsyncSession,
    *,
    limit: int,
) -> list[dict]:
    result = await db.execute(
        select(ProfessionalFeaturedIndex.payload)
        .join(Professional, Professional.user_id == ProfessionalFeaturedIndex.professional_id)
        .join(User, User.id == Professional.user_id)
        .where(*_discovery_filters())
        .order_by(ProfessionalFeaturedIndex.sort_rank.asc())
        .limit(limit)
    )
    return [row for row in result.scalars().all() if isinstance(row, dict)]


async def _rebuild_featured_profiles_index(db: AsyncSession) -> None:
    now_utc = datetime.now(timezone.utc)

    tier_bonus = case(
        (func.lower(Professional.membership_tier) == "premium", 0.30),
        (func.lower(Professional.membership_tier) == "elite", 0.20),
        else_=0.0,
    )
    online_bonus = case((Professional.is_online.is_(True), 0.20), else_=0.0)
    rank_score = (
        (func.coalesce(Professional.rating_avg, 0).cast(Float) * 0.70)
        + (func.least(func.coalesce(Professional.rating_count, 0), 100) * 0.01)
        + tier_bonus
        + online_bonus
    )

    online_or_hybrid_service_exists = exists(
        select(1).where(
            ProfessionalService.professional_id == Professional.user_id,
            ProfessionalService.is_active.is_(True),
            func.lower(ProfessionalService.mode).in_(("online", "hybrid")),
        )
    )

    result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(*_professional_load_options(include_education=False))
        .where(
            func.lower(func.coalesce(Professional.membership_tier, "")).in_(("premium", "elite")),
            online_or_hybrid_service_exists,
            *_discovery_filters(),
        )
        .order_by(
            rank_score.desc(),
            Professional.rating_count.desc(),
            Professional.created_at.desc(),
        )
        .limit(400)
    )
    professionals = result.scalars().all()
    flattened = [_flatten_professional(prof) for prof in professionals]

    await db.execute(delete(ProfessionalFeaturedIndex))

    for idx, profile in enumerate(flattened, start=1):
        rank_value = _quality_score(profile)
        payload = jsonable_encoder(profile)
        db.add(
            ProfessionalFeaturedIndex(
                professional_id=profile["id"],
                sort_rank=idx,
                rank_score=rank_value,
                membership_tier=(str(profile.get("membership_tier") or "").lower() or None),
                payload=payload,
                updated_at=now_utc,
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
        "cover_image_url": to_public_profile_media_url(prof.cover_image_url),
        "profile_image_url": to_public_profile_media_url(prof.profile_image_url),
        "specialization": prof.specialization,
        "membership_tier": prof.membership_tier,
        "experience_years": prof.experience_years,
        "location": prof.location,
        "sex": prof.sex,
        "short_bio": prof.short_bio,
        "about": prof.about,
        # Extended fields
        "pronouns": prof.pronouns,
        "who_i_work_with": prof.who_i_work_with,
        "client_goals": list(prof.client_goals) if prof.client_goals else [],
        "response_time_hours": int(prof.response_time_hours or 24),
        "cancellation_hours": int(prof.cancellation_hours or 24),
        "social_links": dict(prof.social_links) if prof.social_links else {},
        "video_intro_url": prof.video_intro_url,
        "default_timezone": prof.default_timezone or "UTC",
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

    if payload.services:
        initial_service_seen = False
        for service in payload.services:
            raw_name = service.name.strip()
            is_initial_service = _is_initial_consultation_name(raw_name)
            if is_initial_service and initial_service_seen:
                continue

            if is_initial_service:
                initial_service_seen = True

            price_value = float(service.price)
            offer_type = service.offer_type.strip().lower()
            offers_text = service.offers.strip() if service.offers else None
            offer_value = service.offer_value
            offer_label = service.offer_label.strip() if service.offer_label else None

            if is_initial_service:
                if price_value != _DEFAULT_INITIAL_CONSULTATION_PRICE:
                    offer_type = "none"
                    offers_text = None
                    offer_value = None
                    offer_label = None
                elif offer_type in {"", "none"} and offer_value is None and offer_label is None and offers_text is None:
                    offer_type = "cashback"
                    offers_text = "100% refund as credits"
                    offer_value = _DEFAULT_INITIAL_CONSULTATION_PRICE
                    offer_label = "100% refund as credits"

            db.add(
                ProfessionalService(
                    professional_id=professional_id,
                    name=_DEFAULT_INITIAL_CONSULTATION_NAME if is_initial_service else raw_name,
                    short_brief=service.short_brief.strip() if service.short_brief else None,
                    price=service.price,
                    offers=offers_text,
                    negotiable=service.negotiable,
                    offer_type=offer_type,
                    offer_value=offer_value,
                    offer_label=offer_label,
                    offer_starts_at=service.offer_starts_at,
                    offer_ends_at=service.offer_ends_at,
                    mode=service.mode.strip(),
                    duration_value=service.duration_value,
                    duration_unit=_normalize_duration_unit(service.duration_unit),
                    is_active=service.is_active,
                )
            )

        if not initial_service_seen:
            db.add(_build_default_initial_consultation_service(professional_id=professional_id))
    else:
        db.add(_build_default_initial_consultation_service(professional_id=professional_id))

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
        select(Professional.username)
        .join(User, User.id == Professional.user_id)
        .where(Professional.user_id == professional_id, User.user_status == "verified")
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

    if lat is None and lng is None:
        indexed_profiles = await _load_featured_profiles_from_index(db, limit=limit)
        if indexed_profiles:
            return [ProfessionalProfileOut(**profile) for profile in indexed_profiles]

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
        .join(User, User.id == Professional.user_id)
        .options(*_professional_load_options(include_education=False))
        .where(has_usable_coordinates, *_discovery_filters())
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
    trimmed_query = q.strip()
    candidate_result = await db.execute(
        select(
            Professional.user_id,
            Professional.username,
            User.full_name,
            Professional.specialization,
            Professional.location,
            Professional.short_bio,
            Professional.about,
            Professional.rating_avg,
            Professional.rating_count,
            Professional.experience_years,
            Professional.membership_tier,
            Professional.profile_completeness,
        )
        .join(User, User.id == Professional.user_id)
        .where(*_discovery_filters())
        .order_by(Professional.rating_avg.desc(), Professional.rating_count.desc())
        .limit(220)
    )

    candidates: list[dict] = []
    for row in candidate_result.all():
        candidates.append(
            {
                "id": row.user_id,
                "username": row.username,
                "name": row.full_name or row.username,
                "specialization": row.specialization,
                "category": row.specialization,
                "location": row.location,
                "short_bio": row.short_bio,
                "about": row.about,
                "approach": None,
                "subcategories": [],
                "specializations": [],
                "rating": float(row.rating_avg) if row.rating_avg is not None else 0,
                "review_count": int(row.rating_count or 0),
                "experience_years": int(row.experience_years or 0),
                "membership_tier": row.membership_tier,
                "profile_completeness": int(row.profile_completeness or 0),
                "is_online": False,
            }
        )

    ranked_candidates = rank_professional_profiles(candidates, trimmed_query, limit=max(limit * 3, 30))
    ranked_candidates = _apply_results_boost_strategy(
        ranked_candidates,
        query=trimmed_query,
        limit=max(limit * 2, 20),
    )
    ranked_ids = [item["id"] for item in ranked_candidates[:limit]]
    if not ranked_ids:
        return []

    detailed_result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(*_professional_load_options(include_education=False))
        .where(Professional.user_id.in_(ranked_ids), *_discovery_filters())
    )
    professionals_by_id = {prof.user_id: prof for prof in detailed_result.scalars().all()}

    ranked: list[dict] = []
    for prof_id in ranked_ids:
        prof = professionals_by_id.get(prof_id)
        if prof is None:
            continue
        ranked.append(_flatten_professional(prof))

    ranked = _apply_results_boost_strategy(ranked, query=trimmed_query, limit=limit)
    await _record_boost_impressions(
        db=db,
        profiles=ranked,
        surface="results",
        query_text=trimmed_query or None,
    )

    return [ProfessionalProfileOut(**profile) for profile in ranked]


@router.get("/{professional_id}/reviews", response_model=ReviewPageOut)
async def get_professional_reviews(
    professional_id: uuid.UUID,
    limit: int = Query(default=3, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    cursor_created_at: datetime | None = Query(default=None),
    cursor_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db_session),
) -> ReviewPageOut:
    """Fetch paginated reviews for a professional."""
    count_result = await db.execute(
        select(func.count()).select_from(ProfessionalReview).where(
            ProfessionalReview.professional_id == professional_id
        )
    )
    total = count_result.scalar_one()

    items_query = (
        select(ProfessionalReview)
        .where(ProfessionalReview.professional_id == professional_id)
        .order_by(ProfessionalReview.created_at.desc(), ProfessionalReview.id.desc())
        .limit(limit)
        .options(selectinload(ProfessionalReview.reviewer))
    )
    if cursor_created_at is not None and cursor_id is not None:
        items_query = items_query.where(
            or_(
                ProfessionalReview.created_at < cursor_created_at,
                and_(
                    ProfessionalReview.created_at == cursor_created_at,
                    ProfessionalReview.id < cursor_id,
                ),
            )
        )
    else:
        items_query = items_query.offset(offset)

    items_result = await db.execute(items_query)
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
    await _ensure_professional_for_current_user(db=db, current_user=current_user)
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
    await _ensure_professional_for_current_user(db=db, current_user=current_user)
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
    prof.cover_image_url = normalize_profile_media_path(payload.cover_image_url)
    prof.profile_image_url = normalize_profile_media_path(payload.profile_image_url)
    prof.specialization = payload.specialization.strip()
    prof.membership_tier = payload.membership_tier.strip() if payload.membership_tier else None
    prof.experience_years = payload.experience_years
    prof.sex = payload.sex.strip()
    prof.short_bio = payload.short_bio.strip() if payload.short_bio else None
    prof.about = payload.about.strip() if payload.about else None

    # Extended fields
    prof.pronouns = payload.pronouns.strip() if payload.pronouns else None
    prof.who_i_work_with = payload.who_i_work_with.strip() if payload.who_i_work_with else None
    prof.client_goals = [g.strip() for g in payload.client_goals if g.strip()] or None
    prof.response_time_hours = payload.response_time_hours
    prof.cancellation_hours = payload.cancellation_hours
    prof.social_links = payload.social_links or {}
    prof.video_intro_url = payload.video_intro_url.strip() if payload.video_intro_url else None
    prof.default_timezone = (payload.default_timezone or "UTC").strip()

    service_areas = _build_service_areas(payload)
    primary_area = next((item for item in service_areas if item["is_primary"]), None)
    fallback_location = payload.location.strip() if payload.location else None

    prof.location = primary_area["city_name"] if primary_area else fallback_location
    prof.latitude = primary_area["latitude"] if primary_area else None
    prof.longitude = primary_area["longitude"] if primary_area else None
    previous_completeness = int(prof.profile_completeness or 0)
    prof.profile_completeness = _compute_profile_completeness(professional=prof)
    new_completeness = prof.profile_completeness

    await _replace_professional_children(
        db=db,
        professional_id=current_user.user_id,
        payload=payload,
        include_education=include_education,
        service_areas=service_areas,
    )
    await db.commit()

    # Award milestone coins for 50 / 75 / 100 % completeness thresholds.
    # award_coins is idempotent — duplicate calls are silently ignored.
    for threshold, event_type in (
        (50, "profile_milestone_50"),
        (75, "profile_milestone_75"),
        (100, "profile_milestone_100"),
    ):
        if previous_completeness < threshold <= new_completeness:
            await award_coins(
                db,
                user_id=current_user.user_id,
                event_type=event_type,
                reference_type="professional",
                reference_id=str(current_user.user_id),
            )
    if new_completeness != previous_completeness:
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


@router.post("/me/profile/publish", response_model=PublishProfileOut)
async def publish_my_professional_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PublishProfileOut:
    """Publish the current draft (snapshot in draft_profile) to the live profile.

    Currently the PUT /me/editor endpoint saves directly to live tables, so this
    endpoint stores a published snapshot in draft_profile and clears it.  Future
    iterations may introduce a true staging buffer; for now publishing simply
    marks the profile as explicitly published and returns a confirmation.
    """
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional profile not found")

    # Clear any saved draft since the live profile IS the current state
    prof.draft_profile = None
    prof.draft_updated_at = None
    await db.commit()
    return PublishProfileOut(ok=True, message="Profile published successfully.")


@router.get("/me/profile/draft", response_model=ProfessionalProfileOut | None)
async def get_my_draft_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalProfileOut | None:
    """Return the saved draft profile snapshot, or the live profile if no draft exists."""
    include_education = await _has_professional_education_table(db)
    result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.user_id == current_user.user_id)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional profile not found")
    return ProfessionalProfileOut(**_flatten_professional(prof))


@router.get("/{username}", response_model=ProfessionalProfileOut)
async def get_professional_by_username(
    username: str,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalProfileOut:
    """Fetch a full professional profile by username (slug)."""
    include_education = await _has_professional_education_table(db)
    result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(*_professional_load_options(include_education=include_education))
        .where(Professional.username == username, User.user_status == "verified")
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=404, detail="Professional not found")
    return ProfessionalProfileOut(**_flatten_professional(prof))
