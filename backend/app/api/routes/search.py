from __future__ import annotations

from fastapi import APIRouter

from app.schemas.search import SearchParseIn, SearchParseOut
from app.search import parse_search_query

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/parse", response_model=SearchParseOut)
async def parse_user_search_query(payload: SearchParseIn) -> SearchParseOut:
    parsed = parse_search_query(payload.query)

    return SearchParseOut(
        normalized_query=parsed.normalized_query,
        keywords=parsed.keywords,
        tokens=parsed.tokens,
        entities=parsed.entities,
        category_hint=parsed.category_hint,
        session_type_hint=parsed.session_type_hint,
        min_rating_hint=parsed.min_rating_hint,
        min_hourly_rate_hint=parsed.min_hourly_rate_hint,
        max_hourly_rate_hint=parsed.max_hourly_rate_hint,
        timeframe_hint=parsed.timeframe_hint,
        location_hint=parsed.location_hint,
        expanded_keywords=parsed.expanded_keywords,
        is_multi_category=parsed.is_multi_category,
    )
