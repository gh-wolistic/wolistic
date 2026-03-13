"""Multi-category content ranking for the Wolistic search results page.

Ranks products, services, and articles by lexical tag+text match against a query,
using the same synonym expansion as professional_search.
"""

from __future__ import annotations

import re

# Synonym map shared with professional_search for consistent behavior
_SYNONYMS: dict[str, set[str]] = {
    "diet":       {"diet", "nutrition", "dietitian", "meal", "food", "gut"},
    "nutrition":  {"nutrition", "diet", "dietitian", "meal", "food"},
    "protein":    {"protein", "supplement", "whey", "muscle"},
    "strength":   {"strength", "conditioning", "fitness", "training", "muscle", "gym", "workout"},
    "yoga":       {"yoga", "flexibility", "stretch", "mind", "meditation"},
    "meditation": {"meditation", "mindfulness", "mind", "stress", "calm"},
    "fitness":    {"fitness", "exercise", "workout", "gym", "training", "strength"},
    "wellness":   {"wellness", "health", "wellbeing", "holistic"},
    "weight":     {"weight", "loss", "fat", "body", "obesity"},
    "sleep":      {"sleep", "rest", "recovery", "insomnia"},
    "stress":     {"stress", "anxiety", "mind", "mental", "mindfulness"},
    "sara":       {"sara", "sarah"},
    "sarah":      {"sarah", "sara"},
}


def _tokenize(text: str) -> list[str]:
    return [t for t in re.split(r"[\s\-_/,]+", text.lower()) if t]


def _expand(tokens: list[str]) -> set[str]:
    expanded: set[str] = set()
    for tok in tokens:
        expanded.add(tok)
        expanded.update(_SYNONYMS.get(tok, set()))
    return expanded


def _text_score(query_tokens: set[str], *fields: str | None) -> int:
    """Count how many query tokens appear in any of the provided text fields."""
    combined = " ".join(f.lower() for f in fields if f)
    if not combined:
        return 0
    score = 0
    for tok in query_tokens:
        if len(tok) < 3:
            if re.search(r"\b" + re.escape(tok) + r"\b", combined):
                score += 1
        else:
            if tok in combined:
                score += 1
    return score


def rank_products(
    products: list[dict],
    query: str,
    *,
    limit: int = 6,
) -> list[dict]:
    """Return up to *limit* products ranked by relevance to *query*.

    If *query* is blank, return the top *limit* by sort_order.
    """
    if not query or not query.strip():
        return sorted(products, key=lambda p: p.get("sort_order", 0))[:limit]

    query_tokens = _expand(_tokenize(query))
    scored: list[tuple[int, dict]] = []
    for product in products:
        tags = " ".join(product.get("tags") or [])
        score = _text_score(
            query_tokens,
            product.get("name"),
            product.get("category"),
            product.get("brand"),
            product.get("description"),
            tags,
        )
        if score > 0:
            scored.append((score, product))

    scored.sort(key=lambda x: (-x[0], x[1].get("sort_order", 0)))
    return [p for _, p in scored[:limit]]


def rank_services(
    services: list[dict],
    query: str,
    *,
    limit: int = 6,
) -> list[dict]:
    """Return up to *limit* services ranked by relevance to *query*."""
    if not query or not query.strip():
        return sorted(services, key=lambda s: s.get("sort_order", 0))[:limit]

    query_tokens = _expand(_tokenize(query))
    scored: list[tuple[int, dict]] = []
    for svc in services:
        tags = " ".join(svc.get("tags") or [])
        score = _text_score(
            query_tokens,
            svc.get("title"),
            svc.get("type"),
            svc.get("location"),
            tags,
        )
        if score > 0:
            scored.append((score, svc))

    scored.sort(key=lambda x: (-x[0], x[1].get("sort_order", 0)))
    return [s for _, s in scored[:limit]]


def rank_articles(
    articles: list[dict],
    query: str,
    *,
    limit: int = 6,
) -> list[dict]:
    """Return up to *limit* articles ranked by relevance to *query*."""
    if not query or not query.strip():
        return sorted(articles, key=lambda a: a.get("sort_order", 0))[:limit]

    query_tokens = _expand(_tokenize(query))
    scored: list[tuple[int, dict]] = []
    for article in articles:
        tags = " ".join(article.get("tags") or [])
        score = _text_score(
            query_tokens,
            article.get("title"),
            tags,
        )
        if score > 0:
            scored.append((score, article))

    scored.sort(key=lambda x: (-x[0], x[1].get("sort_order", 0)))
    return [a for _, a in scored[:limit]]
