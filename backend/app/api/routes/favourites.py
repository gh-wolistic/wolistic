from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.user import UserFavourite

router = APIRouter(prefix="/favourites", tags=["favourites"])


class FavouriteStatusOut(BaseModel):
    is_favourite: bool


@router.get("/{professional_id}", response_model=FavouriteStatusOut)
async def get_favourite_status(
    professional_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> FavouriteStatusOut:
    """Return whether the current user has favourited the given professional."""
    result = await db.execute(
        select(UserFavourite).where(
            UserFavourite.user_id == current_user.user_id,
            UserFavourite.professional_id == professional_id,
        )
    )
    return FavouriteStatusOut(is_favourite=result.scalar_one_or_none() is not None)


@router.post("/{professional_id}", response_model=FavouriteStatusOut)
async def add_favourite(
    professional_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> FavouriteStatusOut:
    """Add a professional to the current user's favourites (idempotent)."""
    existing = await db.execute(
        select(UserFavourite).where(
            UserFavourite.user_id == current_user.user_id,
            UserFavourite.professional_id == professional_id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(
            UserFavourite(
                user_id=current_user.user_id,
                professional_id=professional_id,
            )
        )
        await db.commit()
    return FavouriteStatusOut(is_favourite=True)


@router.delete("/{professional_id}", response_model=FavouriteStatusOut)
async def remove_favourite(
    professional_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> FavouriteStatusOut:
    """Remove a professional from the current user's favourites (idempotent)."""
    await db.execute(
        delete(UserFavourite).where(
            UserFavourite.user_id == current_user.user_id,
            UserFavourite.professional_id == professional_id,
        )
    )
    await db.commit()
    return FavouriteStatusOut(is_favourite=False)
