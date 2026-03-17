from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.schemas.auth import AuthMeOut, UpdateOnboardingIn

router = APIRouter(prefix="/auth", tags=["auth"])

PARTNER_USER_STATUS_VALUES = {"pending", "verified", "suspended"}


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
    result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    return _to_auth_me_out(user)


@router.patch("/onboarding", response_model=AuthMeOut)
async def update_auth_onboarding(
    payload: UpdateOnboardingIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AuthMeOut:
    result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    user.user_type = payload.user_type
    user.user_subtype = payload.user_subtype

    if payload.user_type == "client":
        user.user_status = "verified"
    elif user.user_status not in PARTNER_USER_STATUS_VALUES:
        user.user_status = "pending"

    await db.commit()
    await db.refresh(user)

    return _to_auth_me_out(user)