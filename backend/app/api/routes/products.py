"""Product API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.wolistic_content import WolisticProduct
from app.schemas.wolistic import ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/featured", response_model=list[ProductOut])
async def get_featured_products(
    limit: int = Query(default=8, ge=1, le=8),
    db: AsyncSession = Depends(get_db_session),
) -> list[ProductOut]:
    """Return featured products ordered by sort_order."""
    result = await db.execute(
        select(WolisticProduct)
        .where(WolisticProduct.is_active.is_(True))
        .order_by(WolisticProduct.sort_order.asc(), WolisticProduct.created_at.desc())
        .limit(limit)
    )
    products = result.scalars().all()

    return [
        ProductOut(
            id=p.id,
            name=p.name,
            image=p.image_url,
            category=p.category,
            brand=p.brand,
            website_name=p.website_name,
            website_url=p.website_url,
            description=p.description,
            price=p.price,
        )
        for p in products
    ]
