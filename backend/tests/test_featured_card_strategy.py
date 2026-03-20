from app.api.routes.professionals import _apply_featured_card_strategy, _apply_results_boost_strategy


def _profile(
    *,
    profile_id: str,
    specialization: str,
    membership_tier: str | None = None,
    is_online: bool = True,
    rating: float = 4.7,
    review_count: int = 80,
) -> dict:
    return {
        "id": profile_id,
        "specialization": specialization,
        "category": specialization,
        "subcategories": [specialization],
        "specializations": [specialization],
        "membership_tier": membership_tier,
        "is_online": is_online,
        "rating": rating,
        "review_count": review_count,
        "location": "Bengaluru",
        "service_areas": [],
    }


def test_featured_strategy_keeps_at_most_one_boosted_in_first_three() -> None:
    ranked = [
        _profile(profile_id="mind-1", specialization="Mind Therapist", rating=4.8, review_count=120),
        _profile(profile_id="body-1", specialization="Physiotherapy Coach", rating=4.7, review_count=100),
        _profile(
            profile_id="diet-boost",
            specialization="Clinical Nutritionist",
            membership_tier="premium",
            is_online=True,
            rating=4.75,
            review_count=140,
        ),
        _profile(
            profile_id="body-boost-2",
            specialization="Strength Trainer",
            membership_tier="elite",
            is_online=True,
            rating=4.72,
            review_count=130,
        ),
    ]

    arranged = _apply_featured_card_strategy(ranked, limit=4, allow_boosted_slot=True)

    boosted_positions = [
        idx
        for idx, profile in enumerate(arranged[:3])
        if profile.get("placement_label") == "Boosted"
    ]

    assert len(boosted_positions) == 1


def test_featured_strategy_prioritizes_role_diversity_for_top_four() -> None:
    ranked = [
        _profile(
            profile_id="boosted",
            specialization="Clinical Nutritionist",
            membership_tier="premium",
            rating=4.79,
            review_count=180,
        ),
        _profile(profile_id="mind-1", specialization="Counseling Therapist", rating=4.7, review_count=90),
        _profile(profile_id="body-1", specialization="Yoga Coach", rating=4.6, review_count=70),
        _profile(profile_id="diet-1", specialization="Diet Nutrition Consultant", rating=4.5, review_count=60),
        _profile(profile_id="other-1", specialization="Wellness Expert", rating=4.4, review_count=50),
    ]

    arranged = _apply_featured_card_strategy(ranked, limit=4, allow_boosted_slot=True)

    top_four_ids = [item["id"] for item in arranged[:4]]
    assert "mind-1" in top_four_ids
    assert "body-1" in top_four_ids
    assert "diet-1" in top_four_ids or "boosted" in top_four_ids
    assert sum(1 for item in arranged[:3] if item.get("placement_label") == "Boosted") <= 1


def test_featured_strategy_disables_boost_when_not_allowed() -> None:
    ranked = [
        _profile(
            profile_id="boosted",
            specialization="Clinical Nutritionist",
            membership_tier="premium",
            rating=4.8,
            review_count=200,
        ),
        _profile(profile_id="mind-1", specialization="Psychology Expert", rating=4.75, review_count=190),
        _profile(profile_id="body-1", specialization="Physiotherapy Coach", rating=4.7, review_count=180),
        _profile(profile_id="diet-1", specialization="Dietitian", rating=4.65, review_count=170),
    ]

    arranged = _apply_featured_card_strategy(ranked, limit=4, allow_boosted_slot=False)

    assert all(item.get("placement_label") != "Boosted" for item in arranged)


def test_results_strategy_allows_single_boosted_slot_within_top_window() -> None:
    ranked = [
        _profile(profile_id="mind-1", specialization="Mind Therapist", rating=4.7, review_count=120),
        _profile(
            profile_id="diet-boosted",
            specialization="Nutrition Expert",
            membership_tier="premium",
            is_online=True,
            rating=4.75,
            review_count=140,
        ),
        _profile(profile_id="body-1", specialization="Fitness Coach", rating=4.65, review_count=110),
    ]

    arranged = _apply_results_boost_strategy(ranked, query="nutrition", limit=8)

    boosted_positions = [
        index
        for index, item in enumerate(arranged[:8])
        if item.get("placement_label") == "Boosted"
    ]
    assert len(boosted_positions) <= 1
    assert len(boosted_positions) == 1


def test_results_strategy_rejects_boosted_when_relevance_is_weak() -> None:
    ranked = [
        _profile(profile_id="mind-1", specialization="Mind Therapist", rating=4.8, review_count=180),
        _profile(
            profile_id="body-boosted",
            specialization="Strength Coach",
            membership_tier="premium",
            is_online=True,
            rating=4.9,
            review_count=220,
        ),
        _profile(profile_id="diet-1", specialization="Dietitian", rating=4.6, review_count=90),
    ]

    arranged = _apply_results_boost_strategy(ranked, query="anxiety counseling", limit=8)

    assert all(item.get("placement_label") != "Boosted" for item in arranged[:8])
