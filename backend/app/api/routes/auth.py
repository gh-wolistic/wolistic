from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.schemas.auth import AuthMeOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthMeOut)
async def get_auth_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> AuthMeOut:
    result = await db.execute(
        select(User, Professional.user_id)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(User.id == current_user.user_id)
    )
    row = result.one_or_none()

    if row is None:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    user, professional_id = row
    display_name = user.full_name or user.email.split("@")[0]
    user_type = "professional" if professional_id is not None else "user"

    return AuthMeOut(
        id=user.id,
        email=user.email,
        name=display_name,
        user_type=user_type,
        user_role=user_type,
    )