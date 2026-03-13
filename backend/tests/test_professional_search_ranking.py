from app.services.ai.professional_search import rank_professional_profiles


SAMPLE_PROFILES = [
    {
        "id": "1",
        "username": "dr-sarah-chen",
        "name": "Dr. Sarah Chen",
        "specialization": "Clinical Nutritionist",
        "category": "Diet & Nutrition",
        "rating": 4.9,
        "review_count": 120,
        "short_bio": "Evidence-based nutrition plans for sustainable health.",
        "about": "Focus on meals, gut health, and long-term behavior change.",
        "approach": "Diet coaching built around realistic routines.",
        "subcategories": ["Clinical Nutrition", "Diet Planning"],
        "specializations": ["Weight Management", "Gut Health"],
    },
    {
        "id": "2",
        "username": "arjun-malhotra",
        "name": "Arjun Malhotra",
        "specialization": "Strength & Conditioning Coach",
        "category": "Fitness & Training",
        "rating": 4.7,
        "review_count": 95,
        "short_bio": "Progressive strength programs for busy professionals.",
        "about": "Structured training with mobility and recovery integration.",
        "approach": "Strength-first plans with measurable weekly progression.",
        "subcategories": ["Strength Training", "Conditioning"],
        "specializations": ["Muscle Gain", "Athletic Performance"],
    },
    {
        "id": "3",
        "username": "meera-shah",
        "name": "Meera Shah",
        "specialization": "Yoga Therapist",
        "category": "Yoga & Mobility",
        "rating": 4.8,
        "review_count": 80,
        "short_bio": "Restorative yoga flows and breathwork.",
        "about": "Mobility and calm through mindful movement.",
        "approach": "Breath-led recovery sessions.",
        "subcategories": ["Mobility", "Breathwork"],
        "specializations": ["Stress Recovery"],
    },
]


def test_name_query_matches_sarah() -> None:
    ranked = rank_professional_profiles(SAMPLE_PROFILES, "Sara", limit=10)

    assert ranked
    assert ranked[0]["username"] == "dr-sarah-chen"


def test_diet_query_prioritizes_nutrition_profile() -> None:
    ranked = rank_professional_profiles(SAMPLE_PROFILES, "Diet", limit=10)

    assert ranked
    assert ranked[0]["username"] == "dr-sarah-chen"


def test_strength_query_prioritizes_arjun() -> None:
    ranked = rank_professional_profiles(SAMPLE_PROFILES, "strength", limit=10)

    assert ranked
    assert ranked[0]["username"] == "arjun-malhotra"
