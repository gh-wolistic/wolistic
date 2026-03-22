from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.catalog import CatalogBrand, CatalogInfluencer, CatalogProduct, CatalogService
from app.schemas.catalog import (
    CatalogBrandDetailOut,
    CatalogBrandSummaryOut,
    CatalogInfluencerOut,
    CatalogProductOut,
    CatalogServiceOut,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _base_products_query() -> Select[tuple[CatalogProduct, CatalogBrand]]:
    return (
        select(CatalogProduct, CatalogBrand)
        .join(CatalogBrand, CatalogBrand.id == CatalogProduct.brand_id)
        .where(CatalogProduct.is_active.is_(True), CatalogBrand.is_active.is_(True))
    )


def _to_product_out(product: CatalogProduct, brand: CatalogBrand) -> CatalogProductOut:
    return CatalogProductOut(
        id=product.id,
        slug=product.slug,
        name=product.name,
        image_url=product.image_url,
        category=product.category,
        description=product.description,
        brand_id=brand.id,
        brand_name=brand.name,
        brand_slug=brand.slug,
        price=product.price,
        rating=float(product.rating or 0),
        external_url=product.external_url,
        is_featured=bool(product.is_featured),
    )


@router.get("/products", response_model=list[CatalogProductOut])
async def list_catalog_products(
    q: str = Query(default="", max_length=300),
    category: str = Query(default="", max_length=120),
    brand_slug: str = Query(default="", max_length=180),
    limit: int = Query(default=60, ge=1, le=120),
    db: AsyncSession = Depends(get_db_session),
) -> list[CatalogProductOut]:
    query = _base_products_query()

    normalized_query = q.strip().lower()
    if normalized_query:
        like_pattern = f"%{normalized_query}%"
        query = query.where(
            or_(
                func.lower(CatalogProduct.name).like(like_pattern),
                func.lower(func.coalesce(CatalogProduct.description, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogProduct.category, "")).like(like_pattern),
                func.lower(CatalogBrand.name).like(like_pattern),
            )
        )

    normalized_category = category.strip().lower()
    if normalized_category:
        query = query.where(func.lower(func.coalesce(CatalogProduct.category, "")) == normalized_category)

    normalized_brand_slug = brand_slug.strip().lower()
    if normalized_brand_slug:
        query = query.where(func.lower(CatalogBrand.slug) == normalized_brand_slug)

    result = await db.execute(
        query
        .order_by(
            CatalogProduct.is_featured.desc(),
            CatalogProduct.sort_order.asc(),
            CatalogProduct.created_at.desc(),
        )
        .limit(limit)
    )
    rows = result.all()
    return [_to_product_out(product, brand) for product, brand in rows]


@router.get("/products/{product_id}", response_model=CatalogProductOut)
async def get_catalog_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
) -> CatalogProductOut:
    result = await db.execute(
        _base_products_query().where(CatalogProduct.id == product_id).limit(1)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product, brand = row
    return _to_product_out(product, brand)


@router.get("/brands", response_model=list[CatalogBrandSummaryOut])
async def list_catalog_brands(
    q: str = Query(default="", max_length=300),
    limit: int = Query(default=60, ge=1, le=120),
    db: AsyncSession = Depends(get_db_session),
) -> list[CatalogBrandSummaryOut]:
    base_conditions = [CatalogBrand.is_active.is_(True)]
    normalized_query = q.strip().lower()
    if normalized_query:
        like_pattern = f"%{normalized_query}%"
        base_conditions.append(
            or_(
                func.lower(CatalogBrand.name).like(like_pattern),
                func.lower(func.coalesce(CatalogBrand.description, "")).like(like_pattern),
                func.exists(
                    select(CatalogProduct.id).where(
                        and_(
                            CatalogProduct.brand_id == CatalogBrand.id,
                            CatalogProduct.is_active.is_(True),
                            or_(
                                func.lower(CatalogProduct.name).like(like_pattern),
                                func.lower(func.coalesce(CatalogProduct.category, "")).like(like_pattern),
                            ),
                        )
                    )
                ),
            )
        )

    brand_result = await db.execute(
        select(CatalogBrand)
        .where(*base_conditions)
        .order_by(CatalogBrand.sort_order.asc(), CatalogBrand.created_at.desc())
        .limit(limit)
    )
    brands = brand_result.scalars().all()
    if not brands:
        return []

    brand_ids = [brand.id for brand in brands]
    products_result = await db.execute(
        select(CatalogProduct)
        .where(CatalogProduct.brand_id.in_(brand_ids), CatalogProduct.is_active.is_(True))
    )
    products = products_result.scalars().all()

    products_by_brand: dict[uuid.UUID, list[CatalogProduct]] = {brand_id: [] for brand_id in brand_ids}
    for product in products:
        products_by_brand.setdefault(product.brand_id, []).append(product)

    summaries: list[CatalogBrandSummaryOut] = []
    for brand in brands:
        brand_products = products_by_brand.get(brand.id, [])
        if brand_products:
            prices = [max(0, int(item.price or 0)) for item in brand_products]
            ratings = [float(item.rating or 0) for item in brand_products]
            categories = sorted({item.category for item in brand_products if item.category})
            avg_rating = sum(ratings) / len(ratings)
            min_price = min(prices)
            max_price = max(prices)
        else:
            categories = []
            avg_rating = 0.0
            min_price = 0
            max_price = 0

        summaries.append(
            CatalogBrandSummaryOut(
                id=brand.id,
                slug=brand.slug,
                name=brand.name,
                logo_url=brand.logo_url,
                hero_image_url=brand.hero_image_url,
                product_count=len(brand_products),
                avg_rating=avg_rating,
                min_price=min_price,
                max_price=max_price,
                categories=categories,
            )
        )

    return summaries


@router.get("/brands/{brand_slug}", response_model=CatalogBrandDetailOut)
async def get_catalog_brand(
    brand_slug: str,
    db: AsyncSession = Depends(get_db_session),
) -> CatalogBrandDetailOut:
    normalized_slug = brand_slug.strip().lower()
    brand_result = await db.execute(
        select(CatalogBrand)
        .where(CatalogBrand.is_active.is_(True), func.lower(CatalogBrand.slug) == normalized_slug)
        .limit(1)
    )
    brand = brand_result.scalar_one_or_none()
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")

    product_result = await db.execute(
        select(CatalogProduct)
        .where(CatalogProduct.brand_id == brand.id, CatalogProduct.is_active.is_(True))
        .order_by(CatalogProduct.sort_order.asc(), CatalogProduct.created_at.desc())
    )
    products = product_result.scalars().all()

    product_items = [_to_product_out(product, brand) for product in products]
    ratings = [item.rating for item in product_items]
    prices = [item.price for item in product_items]
    categories = sorted({item.category for item in product_items if item.category})

    return CatalogBrandDetailOut(
        id=brand.id,
        slug=brand.slug,
        name=brand.name,
        logo_url=brand.logo_url,
        hero_image_url=brand.hero_image_url,
        website_url=brand.website_url,
        description=brand.description,
        products=product_items,
        categories=categories,
        avg_rating=(sum(ratings) / len(ratings)) if ratings else 0,
        min_price=min(prices) if prices else 0,
        max_price=max(prices) if prices else 0,
    )


@router.get("/services", response_model=list[CatalogServiceOut])
async def list_catalog_services(
    q: str = Query(default="", max_length=300),
    limit: int = Query(default=60, ge=1, le=120),
    db: AsyncSession = Depends(get_db_session),
) -> list[CatalogServiceOut]:
    query = select(CatalogService).where(CatalogService.is_active.is_(True))
    normalized_query = q.strip().lower()
    if normalized_query:
        like_pattern = f"%{normalized_query}%"
        query = query.where(
            or_(
                func.lower(CatalogService.name).like(like_pattern),
                func.lower(func.coalesce(CatalogService.accreditation_body, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogService.eligibility, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogService.duration, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogService.delivery_format, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogService.fees, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogService.verification_method, "")).like(like_pattern),
            )
        )

    result = await db.execute(
        query.order_by(CatalogService.sort_order.asc(), CatalogService.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        CatalogServiceOut(
            id=row.id,
            slug=row.slug,
            name=row.name,
            image_url=row.image_url,
            service_type=row.service_type,
            accreditation_body=row.accreditation_body,
            location=row.location,
            eligibility=row.eligibility,
            duration=row.duration,
            delivery_format=row.delivery_format,
            fees=row.fees,
            verification_method=row.verification_method,
            focus_areas=row.focus_areas or [],
            apply_url=row.apply_url,
            description=row.description,
        )
        for row in rows
    ]


@router.get("/services/{service_id}", response_model=CatalogServiceOut)
async def get_catalog_service(
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
) -> CatalogServiceOut:
    result = await db.execute(
        select(CatalogService)
        .where(CatalogService.id == service_id, CatalogService.is_active.is_(True))
        .limit(1)
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    return CatalogServiceOut(
        id=service.id,
        slug=service.slug,
        name=service.name,
        image_url=service.image_url,
        service_type=service.service_type,
        accreditation_body=service.accreditation_body,
        location=service.location,
        eligibility=service.eligibility,
        duration=service.duration,
        delivery_format=service.delivery_format,
        fees=service.fees,
        verification_method=service.verification_method,
        focus_areas=service.focus_areas or [],
        apply_url=service.apply_url,
        description=service.description,
    )


@router.get("/influencers", response_model=list[CatalogInfluencerOut])
async def list_catalog_influencers(
    q: str = Query(default="", max_length=300),
    limit: int = Query(default=60, ge=1, le=120),
    db: AsyncSession = Depends(get_db_session),
) -> list[CatalogInfluencerOut]:
    query = select(CatalogInfluencer).where(CatalogInfluencer.is_active.is_(True))

    normalized_query = q.strip().lower()
    if normalized_query:
        like_pattern = f"%{normalized_query}%"
        query = query.where(
            or_(
                func.lower(CatalogInfluencer.name).like(like_pattern),
                func.lower(func.coalesce(CatalogInfluencer.focus, "")).like(like_pattern),
                func.lower(func.coalesce(CatalogInfluencer.content_summary, "")).like(like_pattern),
            )
        )

    result = await db.execute(
        query.order_by(CatalogInfluencer.sort_order.asc(), CatalogInfluencer.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        CatalogInfluencerOut(
            id=row.id,
            slug=row.slug,
            name=row.name,
            image_url=row.image_url,
            focus=row.focus,
            follower_count=row.follower_count,
            content_summary=row.content_summary,
            profile_url=row.profile_url,
            created_at=row.created_at,
        )
        for row in rows
    ]