from __future__ import annotations

import re
from dataclasses import dataclass

from app.search.constants import (
    BUDGET_PATTERNS,
    CATEGORY_KEYWORDS,
    RATING_INDICATORS,
    SESSION_TYPE_KEYWORDS,
    STOP_WORDS,
    TIMEFRAME_PATTERN,
)


@dataclass(slots=True)
class ParsedSearchQuery:
    normalized_query: str
    tokens: list[str]
    category_hint: str | None
    session_type_hint: str | None
    min_rating_hint: float | None
    min_hourly_rate_hint: int | None
    max_hourly_rate_hint: int | None
    timeframe_hint: str | None
    is_multi_category: bool = False


def _tokenize(value: str) -> list[str]:
    candidates = re.findall(r"[a-z0-9]+", value.lower())
    tokens: list[str] = []
    for token in candidates:
        if len(token) <= 1 or token in STOP_WORDS:
            continue
        tokens.append(token)
    return tokens


def _infer_category(tokens: list[str]) -> tuple[str | None, bool]:
    if not tokens:
        return None, False

    token_set = set(tokens)
    scores: dict[str, int] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        scores[category] = len(token_set.intersection(keywords))

    matching_categories = {cat: score for cat, score in scores.items() if score > 0}
    if not matching_categories:
        return None, False

    sorted_scores = sorted(matching_categories.values(), reverse=True)
    is_multi_category = len(sorted_scores) >= 2 and sorted_scores[1] >= sorted_scores[0] * 0.5
    best_category = max(matching_categories, key=matching_categories.get)
    return best_category, is_multi_category


def _infer_session(tokens: list[str]) -> str | None:
    token_set = set(tokens)
    for session_type, keywords in SESSION_TYPE_KEYWORDS.items():
        if token_set.intersection(keywords):
            return session_type
    return None


def _infer_min_rating(normalized_query: str) -> float | None:
    if any(phrase in normalized_query for phrase in RATING_INDICATORS):
        return 4.5
    return None


def _extract_budget_hints(normalized_query: str) -> tuple[int | None, int | None]:
    max_match = BUDGET_PATTERNS["max"].search(normalized_query)
    min_match = BUDGET_PATTERNS["min"].search(normalized_query)
    max_budget = int(max_match.group(1)) if max_match else None
    min_budget = int(min_match.group(1)) if min_match else None
    return min_budget, max_budget


def _extract_timeframe_hint(normalized_query: str) -> str | None:
    match = TIMEFRAME_PATTERN.search(normalized_query)
    if not match:
        return None
    quantity, unit = match.groups()
    return f"{quantity} {unit.lower()}{'s' if int(quantity) > 1 else ''}"


def parse_search_query(query: str) -> ParsedSearchQuery:
    normalized_query = " ".join(query.lower().split())
    tokens = _tokenize(normalized_query)
    category_hint, is_multi_category = _infer_category(tokens)
    session_type_hint = _infer_session(tokens)
    min_rating_hint = _infer_min_rating(normalized_query)
    min_hourly_rate_hint, max_hourly_rate_hint = _extract_budget_hints(normalized_query)
    timeframe_hint = _extract_timeframe_hint(normalized_query)

    return ParsedSearchQuery(
        normalized_query=normalized_query,
        tokens=tokens,
        category_hint=category_hint,
        session_type_hint=session_type_hint,
        min_rating_hint=min_rating_hint,
        min_hourly_rate_hint=min_hourly_rate_hint,
        max_hourly_rate_hint=max_hourly_rate_hint,
        timeframe_hint=timeframe_hint,
        is_multi_category=is_multi_category,
    )
