"""Ranking helpers for professional search queries."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any

_QUERY_SYNONYMS: dict[str, set[str]] = {
    "diet": {"diet", "nutrition", "dietitian", "meal", "food", "gut"},
    "nutrition": {"nutrition", "diet", "dietitian", "meal", "food"},
    "strength": {"strength", "conditioning", "fitness", "training", "muscle"},
    "fitness": {"fitness", "strength", "conditioning", "training"},
    "sara": {"sara", "sarah"},
    "sarah": {"sarah", "sara"},
}


def _tokenize(value: str | None) -> set[str]:
    if not value:
        return set()
    normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
    return {token for token in normalized.split() if token}


def _expand_tokens(tokens: set[str]) -> set[str]:
    expanded = set(tokens)
    for token in list(tokens):
        expanded.update(_QUERY_SYNONYMS.get(token, {token}))
    return expanded


def _join_non_empty(values: Iterable[str | None]) -> str:
    return " ".join(value for value in values if value)


def _term_match(query_token: str, candidate_token: str) -> bool:
    # Prefix/substring matching makes short names like "Sara" match "Sarah".
    if len(query_token) < 3:
        return query_token == candidate_token
    return query_token in candidate_token


def _field_score(query_tokens: set[str], field_tokens: set[str], weight: float) -> float:
    if not query_tokens or not field_tokens:
        return 0.0

    score = 0.0
    for query_token in query_tokens:
        if any(_term_match(query_token, field_token) for field_token in field_tokens):
            score += weight
    return score


def rank_professional_profiles(
    profiles: Sequence[dict[str, Any]],
    query: str,
    *,
    limit: int,
) -> list[dict[str, Any]]:
    trimmed = query.strip().lower()
    if limit <= 0:
        return []

    if not trimmed:
        return sorted(
            profiles,
            key=lambda profile: (
                float(profile.get("rating") or 0),
                int(profile.get("review_count") or 0),
            ),
            reverse=True,
        )[:limit]

    base_query_tokens = _tokenize(trimmed)
    query_tokens = _expand_tokens(base_query_tokens)

    ranked: list[tuple[float, dict[str, Any]]] = []

    for profile in profiles:
        name_tokens = _tokenize(profile.get("name"))
        username_tokens = _tokenize(profile.get("username"))
        specialization_tokens = _tokenize(profile.get("specialization"))
        category_tokens = _tokenize(profile.get("category"))
        subcategory_tokens = _tokenize(" ".join(profile.get("subcategories") or []))
        expertise_tokens = _tokenize(" ".join(profile.get("specializations") or []))
        bio_tokens = _tokenize(
            _join_non_empty(
                [
                    profile.get("short_bio"),
                    profile.get("about"),
                    profile.get("approach"),
                ]
            )
        )

        lexical_score = 0.0
        lexical_score += _field_score(query_tokens, name_tokens, 12.0)
        lexical_score += _field_score(query_tokens, username_tokens, 10.0)
        lexical_score += _field_score(query_tokens, specialization_tokens, 8.0)
        lexical_score += _field_score(query_tokens, category_tokens, 7.0)
        lexical_score += _field_score(query_tokens, subcategory_tokens, 6.0)
        lexical_score += _field_score(query_tokens, expertise_tokens, 6.0)
        lexical_score += _field_score(query_tokens, bio_tokens, 4.0)

        if lexical_score <= 0:
            continue

        score = lexical_score

        # Minor quality tie-breakers keep highly-rated professionals above similar matches.
        score += float(profile.get("rating") or 0) * 0.2
        score += min(int(profile.get("review_count") or 0), 100) * 0.01

        ranked.append((score, profile))

    ranked.sort(
        key=lambda item: (
            item[0],
            float(item[1].get("rating") or 0),
            int(item[1].get("review_count") or 0),
        ),
        reverse=True,
    )

    return [profile for _, profile in ranked[:limit]]
