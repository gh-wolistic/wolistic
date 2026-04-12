from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.professional import Professional, ProfessionalService
from app.models.user import User
from app.schemas.auth import AuthMeOut, UpdateOnboardingIn
from app.services.coins import award_coins

router = APIRouter(prefix="/auth", tags=["auth"])

PARTNER_USER_STATUS_VALUES = {"pending", "verified", "suspended"}
DEFAULT_INITIAL_CONSULTATION_NAME = "Initial Consultation"


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
            == func.lower(func.trim(DEFAULT_INITIAL_CONSULTATION_NAME)),
        )
        .limit(1)
    )
    if existing_service_result.scalar_one_or_none() is not None:
        return

    db.add(
        ProfessionalService(
            professional_id=professional_id,
            name=DEFAULT_INITIAL_CONSULTATION_NAME,
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
    )


def _slugify_username_seed(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized[:40] if normalized else "expert"


def _default_specialization_for_subtype(subtype: str | None) -> str:
    mapping = {
        "body_expert": "Body Wellness",
        "mind_expert": "Mind Wellness",
        "diet_expert": "Nutrition",
        "mutiple_roles": "Holistic Wellness",
        "brand": "Wellness Brand",
        "influencer": "Wellness Creator",
    }
    return mapping.get((subtype or "").strip().lower(), "Wellness Professional")


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


async def _ensure_professional_row_for_partner(*, db: AsyncSession, user: User) -> None:
    if user.user_type != "partner":
        return

    existing_result = await db.execute(
        select(Professional.user_id).where(Professional.user_id == user.id)
    )
    if existing_result.scalar_one_or_none() is not None:
        await _ensure_default_initial_consultation_service(db=db, professional_id=user.id)
        return

    username_seed = user.full_name or user.email.split("@")[0]
    username = await _build_unique_professional_username(db=db, seed=username_seed)
    specialization = _default_specialization_for_subtype(user.user_subtype)

    db.add(
        Professional(
            user_id=user.id,
            username=username,
            specialization=specialization,
        )
    )
    await _ensure_default_initial_consultation_service(db=db, professional_id=user.id)


async def _get_or_create_user(
    *,
    db: AsyncSession,
    current_user: AuthenticatedUser,
) -> User:
    result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = result.scalar_one_or_none()
    if user is not None:
        if (not user.full_name or not user.full_name.strip()) and current_user.full_name:
            user.full_name = current_user.full_name
            await db.commit()
            await db.refresh(user)
        return user

    if not current_user.email:
        raise HTTPException(
            status_code=404,
            detail="Authenticated user not found and token is missing email claim",
        )

    existing_by_email_result = await db.execute(select(User).where(User.email == current_user.email))
    existing_by_email = existing_by_email_result.scalar_one_or_none()
    if existing_by_email is not None:
        if (not existing_by_email.full_name or not existing_by_email.full_name.strip()) and current_user.full_name:
            existing_by_email.full_name = current_user.full_name
            await db.commit()
            await db.refresh(existing_by_email)
        return existing_by_email

    user = User(
        id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.full_name,
    )
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError:
        await db.rollback()
        fallback_result = await db.execute(select(User).where(User.email == current_user.email))
        fallback_user = fallback_result.scalar_one_or_none()
        if fallback_user is None:
            raise
        if (not fallback_user.full_name or not fallback_user.full_name.strip()) and current_user.full_name:
            fallback_user.full_name = current_user.full_name
            await db.commit()
            await db.refresh(fallback_user)
        return fallback_user


def _display_name_for_user(user: User) -> str:
    return user.full_name or user.email.split("@")[0]


def _resolved_user_status(user: User) -> str | None:
    if user.user_type == "client":
        return "verified"

    if user.user_type == "partner":
        if user.user_status in PARTNER_USER_STATUS_VALUES:
            return user.user_status
        return "pending"

    return None


def _to_auth_me_out(user: User) -> AuthMeOut:
    return AuthMeOut(
        id=user.id,
        email=user.email,
        name=_display_name_for_user(user),
        user_type=user.user_type,
        user_subtype=user.user_subtype,
        user_status=_resolved_user_status(user),
        user_role=user.user_subtype or user.user_type,
        onboarding_required=not bool(user.user_type and user.user_subtype),
    )


@router.get("/me", response_model=AuthMeOut)
async def get_auth_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AuthMeOut:
    user = await _get_or_create_user(db=db, current_user=current_user)

    return _to_auth_me_out(user)


@router.patch("/onboarding", response_model=AuthMeOut)
async def update_auth_onboarding(
    payload: UpdateOnboardingIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AuthMeOut:
    user = await _get_or_create_user(db=db, current_user=current_user)

    user.user_type = payload.user_type
    user.user_subtype = payload.user_subtype

    if payload.user_type == "client":
        user.user_status = "verified"
    elif user.user_status not in PARTNER_USER_STATUS_VALUES:
        user.user_status = "pending"

    if payload.user_type == "partner" and payload.user_subtype:
        await _ensure_professional_row_for_partner(db=db, user=user)

    await db.commit()
    await db.refresh(user)

    # Award welcome bonus once per user (idempotency constraint prevents doubles).
    await award_coins(
        db,
        user_id=user.id,
        event_type="welcome_bonus",
        reference_type="user",
        reference_id=str(user.id),
    )

    # Client-specific onboarding bonus.
    if payload.user_type == "client":
        await award_coins(
            db,
            user_id=user.id,
            event_type="client_onboarding_complete",
            reference_type="user",
            reference_id=str(user.id),
        )

    # Reward users who have their display name set (idempotent — fires at most once).
    if user.full_name and user.full_name.strip():
        await award_coins(
            db,
            user_id=user.id,
            event_type="profile_name_set",
            reference_type="user",
            reference_id=str(user.id),
        )

    await db.commit()

    return _to_auth_me_out(user)