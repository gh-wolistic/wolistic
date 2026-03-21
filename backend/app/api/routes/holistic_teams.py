from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings
from app.core.database import get_db_session
from app.models.holistic_team import HolisticTeam, HolisticTeamMember
from app.models.professional import Professional
from app.models.user import User
from app.schemas.holistic_team import (
    CreateHolisticTeamIn,
    HolisticTeamBackfillResponse,
    HolisticTeamListResponse,
    HolisticTeamOut,
    HolisticTeamProfessionalCard,
    HolisticTeamMemberOut,
    PrepareHolisticTeamIn,
    PrepareHolisticTeamOut,
)
from app.services.ai.professional_search import rank_professional_profiles
from app.api.routes.professionals import _flatten_professional

router = APIRouter(prefix="/holistic-teams", tags=["holistic-teams"])
settings = get_settings()
_TEAM_ROLES = ("body", "mind", "diet")


def _role_from_profile(profile: dict) -> str:
    blob = " ".join(
        [
            str(profile.get("specialization") or ""),
            str(profile.get("category") or ""),
            " ".join(str(item) for item in (profile.get("subcategories") or [])),
            " ".join(str(item) for item in (profile.get("specializations") or [])),
        ]
    ).lower()
    if any(token in blob for token in ("mind", "mental", "psych", "therapy", "counsel")):
        return "mind"
    if any(token in blob for token in ("diet", "nutrition", "gut", "meal")):
        return "diet"
    if any(token in blob for token in ("body", "fitness", "strength", "physio", "yoga", "mobility")):
        return "body"
    return "other"


def _member_initial_consultation_price(profile: dict) -> float:
    services = profile.get("services") or []
    if not services:
        return 0.0
    initial = [s for s in services if "initial" in str(s.name).lower() and "consult" in str(s.name).lower()]
    if initial:
        return float(initial[0].price)
    return float(services[0].price)


def _member_mode(profile: dict) -> str:
    modes = [str(s.mode).strip().lower() for s in (profile.get("services") or []) if getattr(s, "mode", None)]
    if not modes:
        return "online"
    unique_modes = set(modes)
    if len(unique_modes) == 1:
        return unique_modes.pop()
    return "hybrid"


def _is_strict_team_composition(members: list[HolisticTeamMember]) -> bool:
    if len(members) != 3:
        return False
    for member in members:
        professional = member.professional
        if professional is None:
            return False
        if (professional.user.user_status if professional.user else None) != "verified":
            return False
        if int(professional.profile_completeness or 0) < settings.PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY:
            return False
    roles = [str(member.role or "").strip().lower() for member in members]
    return sorted(roles) == sorted(_TEAM_ROLES)


def _pick_one_per_role(ranked: list[dict], fallback_pool: list[dict]) -> list[dict]:
    selected_by_role: dict[str, dict] = {}

    for item in ranked:
        role = _role_from_profile(item)
        if role in _TEAM_ROLES and role not in selected_by_role:
            selected_by_role[role] = item
        if len(selected_by_role) == 3:
            break

    if len(selected_by_role) < 3:
        for item in fallback_pool:
            role = _role_from_profile(item)
            if role in _TEAM_ROLES and role not in selected_by_role:
                selected_by_role[role] = item
            if len(selected_by_role) == 3:
                break

    if len(selected_by_role) < 3:
        return []

    return [selected_by_role[role] for role in _TEAM_ROLES]


def _pick_team_with_constraints(
    ranked: list[dict],
    fallback_pool: list[dict],
    *,
    preferred_mode: str | None,
    min_price: float | None,
    max_price: float | None,
) -> list[dict]:
    normalized_mode = (preferred_mode or "").strip().lower() or None
    if normalized_mode not in {None, "online", "offline", "hybrid"}:
        normalized_mode = None

    ranked_order = {str(item.get("id")): idx for idx, item in enumerate(ranked)}
    grouped: dict[str, list[dict]] = {role: [] for role in _TEAM_ROLES}
    seen_by_role: dict[str, set[str]] = {role: set() for role in _TEAM_ROLES}

    def add_candidate(profile: dict) -> None:
        role = _role_from_profile(profile)
        if role not in _TEAM_ROLES:
            return
        key = str(profile.get("id"))
        if not key or key in seen_by_role[role]:
            return
        grouped[role].append(profile)
        seen_by_role[role].add(key)

    for profile in ranked:
        add_candidate(profile)
    for profile in fallback_pool:
        add_candidate(profile)

    if any(len(grouped[role]) == 0 for role in _TEAM_ROLES):
        return []

    bodies = grouped["body"][:12]
    minds = grouped["mind"][:12]
    diets = grouped["diet"][:12]

    best: tuple[float, list[dict]] | None = None

    for body in bodies:
        for mind in minds:
            if str(mind.get("id")) == str(body.get("id")):
                continue
            for diet in diets:
                ids = {str(body.get("id")), str(mind.get("id")), str(diet.get("id"))}
                if len(ids) != 3:
                    continue

                selected = [body, mind, diet]
                total_price = sum(_member_initial_consultation_price(item) for item in selected)
                modes = {_member_mode(item) for item in selected}
                team_mode = modes.pop() if len(modes) == 1 else "hybrid"

                if normalized_mode and team_mode != normalized_mode:
                    continue
                if min_price is not None and total_price < min_price:
                    continue
                if max_price is not None and total_price > max_price:
                    continue

                score = 0.0
                for item in selected:
                    key = str(item.get("id"))
                    score += float(ranked_order.get(key, 1000))

                if best is None or score < best[0]:
                    best = (score, selected)

    if best is not None:
        return best[1]

    return []


def _to_out(team: HolisticTeam) -> HolisticTeamOut:
    members: list[HolisticTeamMemberOut] = []
    sorted_members = sorted(team.members, key=lambda item: (item.sort_order, item.id))
    for member in sorted_members:
        prof = member.professional
        card = HolisticTeamProfessionalCard(
            id=prof.user_id,
            username=prof.username,
            name=prof.user.full_name or prof.username,
            specialization=prof.specialization,
            category=prof.subcategories[0].name if prof.subcategories else None,
            location=prof.location,
            image=prof.profile_image_url,
            rating=float(prof.rating_avg) if prof.rating_avg is not None else 0,
            review_count=prof.rating_count,
            experience_years=prof.experience_years,
            membership_tier=prof.membership_tier,
            is_online=prof.is_online,
        )
        members.append(
            HolisticTeamMemberOut(
                role=member.role,
                sessions_included=member.sessions_included,
                professional=card,
            )
        )

    return HolisticTeamOut(
        id=team.id,
        name=team.name,
        source_type=team.source_type,
        scope=team.scope,
        query_tag=team.query_tag,
        keywords=team.keywords or [],
        pricing_amount=float(team.pricing_amount),
        pricing_currency=team.pricing_currency,
        mode=team.mode,
        sessions_included_total=team.sessions_included_total,
        package_type=team.package_type,
        members=members,
        created_at=team.created_at,
    )


async def _generate_engine_team_if_needed(
    *,
    db: AsyncSession,
    query: str,
    scope: str,
    preferred_mode: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> None:
    if not query.strip():
        return

    normalized_query = query.strip().lower()
    existing = await db.execute(
        select(HolisticTeam)
        .options(selectinload(HolisticTeam.members))
        .where(
            HolisticTeam.source_type == "engine_generated",
            HolisticTeam.scope == scope,
            HolisticTeam.query_tag == normalized_query,
        )
        .order_by(HolisticTeam.created_at.desc())
    )
    existing_teams = existing.scalars().unique().all()
    if any(_is_strict_team_composition(team.members) for team in existing_teams):
        return

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
        )
        .join(User, User.id == Professional.user_id)
        .where(
            User.user_status == "verified",
            Professional.profile_completeness >= settings.PROFILE_COMPLETENESS_MIN_FOR_DISCOVERY,
        )
        .order_by(Professional.rating_avg.desc(), Professional.rating_count.desc())
        .limit(220)
    )
    candidate_profiles: list[dict] = []
    for row in candidate_result.all():
        candidate_profiles.append(
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
                "is_online": False,
            }
        )

    ranked_candidates = rank_professional_profiles(candidate_profiles, normalized_query, limit=90)
    ranked_ids = [item["id"] for item in ranked_candidates]
    if not ranked_ids:
        return

    prof_result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(
            selectinload(Professional.user),
            selectinload(Professional.services),
            selectinload(Professional.subcategories),
            selectinload(Professional.expertise_areas),
        )
        .where(Professional.user_id.in_(ranked_ids))
    )
    by_id = {p.user_id: p for p in prof_result.scalars().all()}
    flattened = [_flatten_professional(by_id[prof_id]) for prof_id in ranked_ids if prof_id in by_id]
    ranked = rank_professional_profiles(flattened, normalized_query, limit=60)
    if not ranked:
        return

    selected = _pick_team_with_constraints(
        ranked,
        flattened,
        preferred_mode=preferred_mode,
        min_price=min_price,
        max_price=max_price,
    )
    if len(selected) != 3:
        selected = _pick_one_per_role(ranked, flattened)
    if len(selected) != 3:
        return

    total_price = sum(_member_initial_consultation_price(item) for item in selected)
    team_mode_values = {_member_mode(item) for item in selected}
    team_mode = team_mode_values.pop() if len(team_mode_values) == 1 else "hybrid"

    team = HolisticTeam(
        name=f"{query.strip().title()} Team",
        source_type="engine_generated",
        scope=scope,
        query_tag=normalized_query,
        keywords=[token for token in normalized_query.split() if token],
        pricing_amount=total_price,
        pricing_currency="INR",
        mode=team_mode,
        sessions_included_total=3,
        package_type="consultation_only",
        is_active=True,
    )
    db.add(team)
    await db.flush()

    for index, item in enumerate(selected):
        db.add(
            HolisticTeamMember(
                team_id=team.id,
                professional_id=item["id"],
                role=_role_from_profile(item),
                sessions_included=1,
                sort_order=index,
            )
        )

    await db.commit()


def _base_query() -> Select[tuple[HolisticTeam]]:
    return (
        select(HolisticTeam)
        .options(
            selectinload(HolisticTeam.members).selectinload(HolisticTeamMember.professional).selectinload(Professional.user),
            selectinload(HolisticTeam.members).selectinload(HolisticTeamMember.professional).selectinload(Professional.subcategories),
        )
        .where(HolisticTeam.is_active.is_(True))
    )


def _matches_user_preferences(
    team: HolisticTeam,
    *,
    mode: str | None,
    min_price: float | None,
    max_price: float | None,
) -> bool:
    normalized_mode = (mode or "").strip().lower()
    if normalized_mode and team.mode != normalized_mode:
        return False

    pricing = float(team.pricing_amount)
    if min_price is not None and pricing < min_price:
        return False
    if max_price is not None and pricing > max_price:
        return False
    return True


def _recommended_sort_key(
    team: HolisticTeam,
    *,
    normalized_query: str | None,
    mode: str | None,
    min_price: float | None,
    max_price: float | None,
) -> tuple[float, float, float, float, float]:
    pricing = float(team.pricing_amount)

    price_distance = 0.0
    if min_price is not None and pricing < min_price:
        price_distance += min_price - pricing
    if max_price is not None and pricing > max_price:
        price_distance += pricing - max_price

    mode_penalty = 0.0
    normalized_mode = (mode or "").strip().lower()
    if normalized_mode and team.mode != normalized_mode:
        mode_penalty = 1.0

    is_query_match = 0.0
    if normalized_query:
        if team.query_tag == normalized_query or normalized_query in (team.keywords or []):
            is_query_match = -1.0

    strict_match_penalty = 0.0 if _matches_user_preferences(team, mode=mode, min_price=min_price, max_price=max_price) else 1.0
    source_penalty = 0.0 if team.source_type == "engine_generated" else 1.0
    recency_score = -team.created_at.timestamp()

    return (is_query_match, strict_match_penalty + mode_penalty, price_distance, source_penalty, recency_score)


@router.get("", response_model=HolisticTeamListResponse)
async def list_holistic_teams(
    q: str = Query(default="", max_length=300),
    scope: str = Query(default="professionals", max_length=50),
    mode: str | None = Query(default=None),
    package_type: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str = Query(default="recommended"),
    db: AsyncSession = Depends(get_db_session),
) -> HolisticTeamListResponse:
    target_min_results = 6

    await _generate_engine_team_if_needed(
        db=db,
        query=q,
        scope=scope,
        preferred_mode=mode,
        min_price=min_price,
        max_price=max_price,
    )

    query = _base_query().where(HolisticTeam.scope == scope)
    normalized_query = q.strip().lower() if q.strip() else None
    if q.strip():
        query = query.where(
            (HolisticTeam.query_tag == normalized_query)
            | HolisticTeam.keywords.contains([normalized_query])
        )
    if package_type:
        query = query.where(HolisticTeam.package_type == package_type)

    query = query.order_by(HolisticTeam.source_type.asc(), HolisticTeam.created_at.desc())

    result = await db.execute(query.limit(80))
    teams = result.scalars().unique().all()
    valid_teams = [team for team in teams if _is_strict_team_composition(team.members)]

    # If query-specific teams are unavailable or too few, immediately backfill
    # with additional scope-level teams to avoid sparse/empty funnel results.
    if normalized_query and len(valid_teams) < target_min_results:
        fallback_query = _base_query().where(HolisticTeam.scope == scope)
        if package_type:
            fallback_query = fallback_query.where(HolisticTeam.package_type == package_type)
        fallback_query = fallback_query.order_by(HolisticTeam.source_type.asc(), HolisticTeam.created_at.desc())
        fallback_result = await db.execute(fallback_query.limit(80))
        fallback_teams = fallback_result.scalars().unique().all()
        fallback_valid_teams = [team for team in fallback_teams if _is_strict_team_composition(team.members)]

        existing_ids = {str(team.id) for team in valid_teams}
        for fallback_team in fallback_valid_teams:
            fallback_id = str(fallback_team.id)
            if fallback_id in existing_ids:
                continue
            valid_teams.append(fallback_team)
            existing_ids.add(fallback_id)
            if len(valid_teams) >= target_min_results:
                break

    if sort == "price_asc":
        valid_teams.sort(key=lambda team: (float(team.pricing_amount), -team.created_at.timestamp()))
    elif sort == "price_desc":
        valid_teams.sort(key=lambda team: (-float(team.pricing_amount), -team.created_at.timestamp()))
    else:
        valid_teams.sort(
            key=lambda team: _recommended_sort_key(
                team,
                normalized_query=normalized_query,
                mode=mode,
                min_price=min_price,
                max_price=max_price,
            )
        )

    return HolisticTeamListResponse(items=[_to_out(team) for team in valid_teams])


@router.post("/prepare", response_model=PrepareHolisticTeamOut)
async def prepare_holistic_team(
    payload: PrepareHolisticTeamIn,
    db: AsyncSession = Depends(get_db_session),
) -> PrepareHolisticTeamOut:
    await _generate_engine_team_if_needed(
        db=db,
        query=payload.query,
        scope=payload.scope,
        preferred_mode=payload.preferred_mode,
        min_price=payload.min_price,
        max_price=payload.max_price,
    )
    return PrepareHolisticTeamOut(prepared=True)


@router.get("/{team_id}", response_model=HolisticTeamOut)
async def get_holistic_team(
    team_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> HolisticTeamOut:
    try:
        parsed_team_id = UUID(team_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found") from exc

    result = await db.execute(_base_query().where(HolisticTeam.id == parsed_team_id))
    team = result.scalar_one_or_none()
    if team is None or not _is_strict_team_composition(team.members):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return _to_out(team)


@router.post("", response_model=HolisticTeamOut, status_code=status.HTTP_201_CREATED)
async def create_member_collab_team(
    payload: CreateHolisticTeamIn,
    db: AsyncSession = Depends(get_db_session),
    _current_user: AuthenticatedUser = Depends(get_current_user),
) -> HolisticTeamOut:
    if len(payload.members) != 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A team must include exactly 3 members: body, mind, and diet",
        )

    roles = [member.role.strip().lower() for member in payload.members]
    if sorted(roles) != sorted(_TEAM_ROLES):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Team roles must include exactly one body, one mind, and one diet expert",
        )

    cleaned_keywords = [item.strip().lower() for item in payload.keywords if item.strip()]
    if not cleaned_keywords:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one keyword is required for member collaboration teams",
        )

    professional_ids = [item.professional_id for item in payload.members]
    prof_result = await db.execute(select(Professional.user_id).where(Professional.user_id.in_(professional_ids)))
    found_ids = {item for item in prof_result.scalars().all()}
    if len(found_ids) != len(set(professional_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more selected professionals were not found")

    total_sessions = sum(item.sessions_included for item in payload.members)
    team = HolisticTeam(
        name=payload.name,
        source_type="member_collab",
        scope=payload.scope,
        query_tag=None,
        keywords=cleaned_keywords,
        pricing_amount=payload.pricing_amount,
        pricing_currency=payload.pricing_currency,
        mode=payload.mode,
        sessions_included_total=total_sessions,
        package_type=payload.package_type,
        is_active=True,
    )
    db.add(team)
    await db.flush()

    for index, member in enumerate(payload.members):
        db.add(
            HolisticTeamMember(
                team_id=team.id,
                professional_id=member.professional_id,
                role=member.role.lower(),
                sessions_included=member.sessions_included,
                sort_order=index,
            )
        )

    await db.commit()
    result = await db.execute(_base_query().where(HolisticTeam.id == team.id))
    created = result.scalar_one()
    return _to_out(created)


@router.post("/backfill", response_model=HolisticTeamBackfillResponse)
async def backfill_engine_teams(
    scope: str = Query(default="professionals", max_length=50),
    db: AsyncSession = Depends(get_db_session),
    _current_user: AuthenticatedUser = Depends(get_current_user),
) -> HolisticTeamBackfillResponse:
    seed_queries = ["diet", "stress", "weight loss", "sleep", "pcos"]
    created = 0
    for item in seed_queries:
        before = await db.execute(
            select(HolisticTeam.id).where(
                HolisticTeam.source_type == "engine_generated",
                HolisticTeam.scope == scope,
                HolisticTeam.query_tag == item,
            )
        )
        if before.scalars().first() is None:
            await _generate_engine_team_if_needed(db=db, query=item, scope=scope)
            after = await db.execute(
                select(HolisticTeam.id).where(
                    HolisticTeam.source_type == "engine_generated",
                    HolisticTeam.scope == scope,
                    HolisticTeam.query_tag == item,
                    HolisticTeam.is_active.is_(True),
                )
            )
            if after.scalars().first() is not None:
                created += 1

    return HolisticTeamBackfillResponse(created=created)
