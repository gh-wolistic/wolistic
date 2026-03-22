"""AI-powered routes: multi-category Wolistic search."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.models.wolistic_content import WolisticArticle, WolisticProduct, WolisticService
from app.schemas.professional import ProfessionalProfileOut
from app.schemas.wolistic import (
    ProductOut,
    WolisticArticleOut,
    WolisticSearchResponse,
    WolisticServiceOut,
)
from app.services.ai.professional_search import rank_professional_profiles
from app.services.ai.wolistic_search import rank_articles, rank_products, rank_services
from app.api.serializers.professional import flatten_professional

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------


@router.get("/wolistic-search", response_model=WolisticSearchResponse)
async def wolistic_search(
    q: str = Query(default="", max_length=300),
    limit: int = Query(default=6, ge=1, le=20),
    db: AsyncSession = Depends(get_db_session),
) -> WolisticSearchResponse:
    """Multi-category AI search for the Wolistic results page.

    Returns matching professionals, products, services, and articles
    for the given query. Sections with zero matches are returned as
    empty lists (the frontend hides those sections).
    """
    query = q.strip()

    # ── Professionals ─────────────────────────────────────────────────────────
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
                "is_online": False,
            }
        )
    ranked_candidates = rank_professional_profiles(candidates, query, limit=max(limit * 3, 24))
    ranked_ids = [item["id"] for item in ranked_candidates[:limit]]

    detailed_result = await db.execute(
        select(Professional)
        .join(User, User.id == Professional.user_id)
        .options(
            selectinload(Professional.approaches),
            selectinload(Professional.availability_slots),
            selectinload(Professional.certifications),
            selectinload(Professional.expertise_areas),
            selectinload(Professional.gallery),
            selectinload(Professional.languages),
            selectinload(Professional.services),
            selectinload(Professional.session_types),
            selectinload(Professional.subcategories),
        )
        .where(Professional.user_id.in_(ranked_ids))
    )
    by_id = {prof.user_id: prof for prof in detailed_result.scalars().all()}
    ranked_profs = [flatten_professional(by_id[prof_id]) for prof_id in ranked_ids if prof_id in by_id]
    professionals_out = [ProfessionalProfileOut(**p) for p in ranked_profs]

    # ── Products ──────────────────────────────────────────────────────────────
    products_result = await db.execute(
        select(WolisticProduct)
        .where(WolisticProduct.is_active.is_(True))
        .order_by(WolisticProduct.sort_order.asc())
    )
    raw_products = products_result.scalars().all()
    product_dicts = [
        {
            "id": str(p.id),
            "name": p.name,
            "image_url": p.image_url,
            "category": p.category,
            "brand": p.brand,
            "website_name": p.website_name,
            "website_url": p.website_url,
            "description": p.description,
            "price": p.price,
            "tags": p.tags or [],
            "sort_order": p.sort_order,
        }
        for p in raw_products
    ]
    ranked_products = rank_products(product_dicts, query, limit=limit)
    products_out = [
        ProductOut(
            id=p["id"],
            name=p["name"],
            image=p.get("image_url"),
            category=p.get("category"),
            brand=p.get("brand"),
            website_name=p.get("website_name"),
            website_url=p.get("website_url"),
            description=p.get("description"),
            price=p.get("price", 0),
        )
        for p in ranked_products
    ]

    # ── Services ──────────────────────────────────────────────────────────────
    services_result = await db.execute(
        select(WolisticService)
        .where(WolisticService.is_active.is_(True))
        .order_by(WolisticService.sort_order.asc())
    )
    raw_services = services_result.scalars().all()
    service_dicts = [
        {
            "id": str(s.id),
            "title": s.title,
            "type": s.type,
            "location": s.location,
            "image_url": s.image_url,
            "website_name": s.website_name,
            "website_url": s.website_url,
            "tags": s.tags or [],
            "sort_order": s.sort_order,
        }
        for s in raw_services
    ]
    ranked_services = rank_services(service_dicts, query, limit=limit)
    services_out = [
        WolisticServiceOut(
            id=s["id"],
            title=s["title"],
            type=s["type"],
            location=s["location"],
            image_url=s.get("image_url"),
            website_name=s.get("website_name"),
            website_url=s.get("website_url"),
            tags=s.get("tags") or [],
        )
        for s in ranked_services
    ]

    # ── Articles ───────────────────────────────────────────────────────────────
    articles_result = await db.execute(
        select(WolisticArticle)
        .where(WolisticArticle.is_active.is_(True))
        .order_by(WolisticArticle.sort_order.asc())
    )
    raw_articles = articles_result.scalars().all()
    article_dicts = [
        {
            "id": str(a.id),
            "title": a.title,
            "read_time": a.read_time,
            "tags": a.tags or [],
            "sort_order": a.sort_order,
        }
        for a in raw_articles
    ]
    ranked_articles = rank_articles(article_dicts, query, limit=limit)
    articles_out = [
        WolisticArticleOut(
            id=a["id"],
            title=a["title"],
            read_time=a["read_time"],
        )
        for a in ranked_articles
    ]

    return WolisticSearchResponse(
        professionals=professionals_out,
        products=products_out,
        services=services_out,
        articles=articles_out,
    )
