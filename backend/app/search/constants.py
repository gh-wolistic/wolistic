"""Shared search constants and patterns for wellness domain search."""

from __future__ import annotations

import re

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "want",
    "with",
}

CATEGORY_KEYWORDS: dict[str, set[str]] = {
    "Fitness & Training": {
        "workout",
        "gym",
        "strength",
        "cardio",
        "exercise",
        "fitness",
        "training",
        "muscle",
        "fat",
        "weight",
        "loss",
        "gain",
        "bodybuilding",
        "crossfit",
        "abs",
        "core",
        "toning",
        "lean",
        "shred",
        "bulk",
        "physique",
        "athletic",
    },
    "Diet & Nutrition": {
        "diet",
        "nutrition",
        "meal",
        "calorie",
        "protein",
        "supplement",
        "vitamin",
        "weight",
        "food",
        "eating",
        "healthy",
        "macros",
        "keto",
        "vegan",
    },
    "Mental Wellness": {
        "stress",
        "anxiety",
        "depression",
        "mental",
        "therapy",
        "counseling",
        "burnout",
        "mood",
        "emotional",
        "psychological",
        "counselor",
        "therapist",
    },
    "Yoga & Mobility": {
        "yoga",
        "mobility",
        "flexibility",
        "stretch",
        "posture",
        "breath",
        "asana",
        "meditation",
        "mindfulness",
        "pranayama",
    },
    "Life Coaching": {
        "discipline",
        "habit",
        "goal",
        "motivation",
        "routine",
        "accountability",
        "focus",
        "productivity",
        "life coach",
        "personal development",
    },
}

SESSION_TYPE_KEYWORDS: dict[str, set[str]] = {
    "Online": {"online", "virtual", "video", "zoom", "remote", "call", "teleconsultation"},
    "In-Person": {"offline", "in-person", "inperson", "near", "nearby", "visit", "physical"},
}

BUDGET_PATTERNS = {
    "max": re.compile(
        r"\b(?:under|below|less than|max(?:imum)?|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})\b",
        re.IGNORECASE,
    ),
    "min": re.compile(
        r"\b(?:over|above|more than|min(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})\b",
        re.IGNORECASE,
    ),
}

RATING_INDICATORS = {
    "top rated",
    "best",
    "highly rated",
    "top coach",
    "excellent",
    "5 star",
    "highly recommended",
    "premium",
    "expert",
}

TIMEFRAME_PATTERN = re.compile(r"\b(\d+)\s*(day|week|month|year)s?\b", re.IGNORECASE)
