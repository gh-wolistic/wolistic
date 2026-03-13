"""Enhanced search query parser using spaCy with graceful fallback."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import lru_cache

from app.search.constants import (
    BUDGET_PATTERNS,
    CATEGORY_KEYWORDS,
    RATING_INDICATORS,
    SESSION_TYPE_KEYWORDS,
    TIMEFRAME_PATTERN,
)
from app.search.query_parser import parse_search_query as fallback_parser

try:
    import spacy
    from spacy.language import Language

    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    Language = None  # type: ignore[assignment]


WELLNESS_SYNONYMS = {
    "anxious": ["anxiety", "stress", "worried", "nervous"],
    "depressed": ["depression", "sad", "low mood", "down"],
    "weight": ["fat", "obesity", "slim", "fitness"],
    "exercise": ["workout", "fitness", "training", "gym"],
    "nutrition": ["diet", "meal", "food", "eating"],
    "sleep": ["insomnia", "rest", "tired", "fatigue"],
    "pain": ["ache", "hurt", "discomfort", "sore"],
    "yoga": ["asana", "meditation", "mindfulness"],
}


@dataclass(slots=True)
class EnhancedSearchQuery:
    normalized_query: str
    keywords: list[str]
    tokens: list[str]
    entities: dict[str, list[str]] = field(default_factory=dict)
    category_hint: str | None = None
    session_type_hint: str | None = None
    min_rating_hint: float | None = None
    min_hourly_rate_hint: int | None = None
    max_hourly_rate_hint: int | None = None
    timeframe_hint: str | None = None
    location_hint: str | None = None
    expanded_keywords: list[str] = field(default_factory=list)
    is_multi_category: bool = False


@lru_cache(maxsize=1)
def _load_spacy_model() -> Language | None:
    if not SPACY_AVAILABLE:
        return None

    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        return None


def _extract_keywords_with_spacy(doc) -> tuple[list[str], list[str]]:
    keywords: list[str] = []
    all_tokens: list[str] = []

    for token in doc:
        if token.is_punct or token.is_space or token.is_stop:
            continue
        if len(token.text) <= 1:
            continue

        lemma = token.lemma_.lower()
        all_tokens.append(lemma)
        if token.pos_ in {"NOUN", "PROPN", "ADJ", "VERB"}:
            keywords.append(lemma)

    return keywords, all_tokens


def _extract_entities(doc) -> dict[str, list[str]]:
    entities: dict[str, list[str]] = {}
    for ent in doc.ents:
        entities.setdefault(ent.label_, []).append(ent.text)
    return entities


def _infer_category_enhanced(keywords: list[str], tokens: list[str]) -> tuple[str | None, bool]:
    all_words = set(keywords + tokens)
    scores: dict[str, float] = {}

    for category, category_keywords in CATEGORY_KEYWORDS.items():
        score = len(all_words.intersection(category_keywords))
        keyword_bonus = len(set(keywords).intersection(category_keywords)) * 0.5
        scores[category] = score + keyword_bonus

    matching_categories = {cat: score for cat, score in scores.items() if score > 0}
    if not matching_categories:
        return None, False

    sorted_scores = sorted(matching_categories.values(), reverse=True)
    is_multi_category = len(sorted_scores) >= 2 and sorted_scores[1] >= sorted_scores[0] * 0.5
    best_category = max(matching_categories, key=matching_categories.get)
    return best_category, is_multi_category


def _infer_session_type(tokens: list[str]) -> str | None:
    token_set = set(tokens)
    for session_type, keywords in SESSION_TYPE_KEYWORDS.items():
        if token_set.intersection(keywords):
            return session_type
    return None


def _extract_location_from_entities(entities: dict[str, list[str]]) -> str | None:
    locations = entities.get("GPE", []) + entities.get("LOC", [])
    return locations[0] if locations else None


def _extract_budget_hints(query: str) -> tuple[int | None, int | None]:
    max_match = BUDGET_PATTERNS["max"].search(query)
    min_match = BUDGET_PATTERNS["min"].search(query)
    max_budget = int(max_match.group(1)) if max_match else None
    min_budget = int(min_match.group(1)) if min_match else None
    return min_budget, max_budget


def _extract_rating_hint(query: str) -> float | None:
    normalized = query.lower()
    for indicator in RATING_INDICATORS:
        if indicator in normalized:
            return 4.5

    star_match = re.search(r"(\d(?:\.\d)?)\s*(?:star|stars|\*)", normalized)
    if not star_match:
        return None

    rating = float(star_match.group(1))
    if 0 <= rating <= 5:
        return rating
    return None


def _extract_timeframe(query: str) -> str | None:
    match = TIMEFRAME_PATTERN.search(query)
    if not match:
        return None
    quantity, unit = match.groups()
    return f"{quantity} {unit.lower()}{'s' if int(quantity) > 1 else ''}"


def _expand_with_synonyms(keywords: list[str]) -> list[str]:
    expanded = set(keywords)
    for keyword in keywords:
        if keyword in WELLNESS_SYNONYMS:
            expanded.update(WELLNESS_SYNONYMS[keyword])
        for key, synonyms in WELLNESS_SYNONYMS.items():
            if keyword in synonyms:
                expanded.add(key)
                expanded.update(synonyms)
    return list(expanded)


def parse_search_query(query: str) -> EnhancedSearchQuery:
    if not query or not query.strip():
        return EnhancedSearchQuery(normalized_query="", keywords=[], tokens=[])

    nlp = _load_spacy_model()
    if nlp is None:
        legacy_result = fallback_parser(query)
        keywords = legacy_result.tokens[:5]
        expanded = _expand_with_synonyms(keywords)
        return EnhancedSearchQuery(
            normalized_query=legacy_result.normalized_query,
            keywords=keywords,
            tokens=legacy_result.tokens,
            category_hint=legacy_result.category_hint,
            session_type_hint=legacy_result.session_type_hint,
            min_rating_hint=legacy_result.min_rating_hint,
            min_hourly_rate_hint=legacy_result.min_hourly_rate_hint,
            max_hourly_rate_hint=legacy_result.max_hourly_rate_hint,
            timeframe_hint=legacy_result.timeframe_hint,
            is_multi_category=legacy_result.is_multi_category,
            expanded_keywords=expanded,
        )

    doc = nlp(query)
    normalized_query = query.lower().strip()
    keywords, all_tokens = _extract_keywords_with_spacy(doc)
    entities = _extract_entities(doc)

    category_hint, is_multi_category = _infer_category_enhanced(keywords, all_tokens)
    session_type_hint = _infer_session_type(all_tokens)
    location_hint = _extract_location_from_entities(entities)
    min_budget, max_budget = _extract_budget_hints(normalized_query)
    rating_hint = _extract_rating_hint(normalized_query)
    timeframe_hint = _extract_timeframe(normalized_query)
    expanded_keywords = _expand_with_synonyms(keywords)

    return EnhancedSearchQuery(
        normalized_query=normalized_query,
        keywords=keywords,
        tokens=all_tokens,
        entities=entities,
        category_hint=category_hint,
        session_type_hint=session_type_hint,
        min_rating_hint=rating_hint,
        min_hourly_rate_hint=min_budget,
        max_hourly_rate_hint=max_budget,
        timeframe_hint=timeframe_hint,
        location_hint=location_hint,
        expanded_keywords=expanded_keywords,
        is_multi_category=is_multi_category,
    )
