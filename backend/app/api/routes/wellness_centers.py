"""Wellness center API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.wolistic_content import WolisticService
from app.schemas.wolistic import WolisticServiceOut

router = APIRouter(prefix="/wellness-centers", tags=["wellness-centers"])


@router.get("/featured", response_model=list[WolisticServiceOut])
async def get_featured_wellness_centers(
    limit: int = Query(default=8, ge=1, le=8),
    db: AsyncSession = Depends(get_db_session),
) -> list[WolisticServiceOut]:
    """Return featured wellness centers ordered by sort order."""
    result = await db.execute(
        select(WolisticService)
        .where(WolisticService.is_active.is_(True))
        .order_by(WolisticService.sort_order.asc(), WolisticService.created_at.desc())
        .limit(limit)
    )
    centers = result.scalars().all()

    return [
        WolisticServiceOut(
            id=center.id,
            title=center.title,
            type=center.type,
            location=center.location,
            image_url=center.image_url,
            website_name=center.website_name,
            website_url=center.website_url,
            tags=center.tags or [],
        )
        for center in centers
    ]