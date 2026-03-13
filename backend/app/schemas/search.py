from __future__ import annotations

from pydantic import BaseModel, Field


class SearchParseIn(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class SearchParseOut(BaseModel):
    normalized_query: str
    keywords: list[str]
    tokens: list[str]
    entities: dict[str, list[str]]
    category_hint: str | None = None
    session_type_hint: str | None = None
    min_rating_hint: float | None = None
    min_hourly_rate_hint: int | None = None
    max_hourly_rate_hint: int | None = None
    timeframe_hint: str | None = None
    location_hint: str | None = None
    expanded_keywords: list[str]
    is_multi_category: bool = False
