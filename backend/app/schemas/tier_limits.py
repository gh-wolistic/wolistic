"""
TypedDict definitions for subscription tier limits.
Provides type safety and IDE autocomplete for JSONB limits field.

Usage:
    from app.schemas.tier_limits import TierLimits
    
    limits: TierLimits = {
        "services_limit": 5,
        "coin_multiplier": 1.5,
        # ...
    }
"""
from typing import TypedDict, NotRequired


class TierLimits(TypedDict, total=False):
    """
    Comprehensive tier limits structure (JSONB).
    
    All fields are optional to allow partial limit definitions.
    Use NotRequired for Phase 2+ fields that may not be present.
    """
    
    # ── Profile Limits (Common Infrastructure) ────────────────────────────────
    certificates_limit: int
    """Maximum verified certifications a professional can add"""
    
    languages_limit: int
    """Maximum languages a professional can offer services in"""
    
    education_items_limit: int
    """Maximum education entries on profile"""
    
    expertise_areas_limit: int
    """Maximum expertise tags/areas"""
    
    approaches_limit: int
    """Maximum therapeutic approaches"""
    
    subcategories_limit: int
    """Maximum service subcategories"""
    
    gallery_items_limit: int
    """Maximum gallery photos/videos"""
    
    booking_questions_limit: int
    """Maximum custom booking questions (future feature)"""
    
    # ── Operational Limits (Tier-Based Features) ──────────────────────────────
    services_limit: int
    """Maximum active service offerings"""
    
    booking_slots_limit: int
    """Maximum availability slots per month"""
    
    client_invites_per_day: int
    """Maximum client invites per day (with daily reset)"""
    
    client_invites_per_month: int
    """Maximum client invites per month"""
    
    leads_per_day: int
    """Maximum new leads accepted per day"""
    
    leads_total_limit: int
    """Maximum total active leads"""
    
    followups_per_day: int
    """Maximum follow-ups created per day"""
    
    followups_total_limit: int
    """Maximum active follow-ups"""
    
    routines_limit: int
    """Maximum active client routines"""
    
    routine_templates_limit: int
    """Maximum reusable routine templates"""
    
    group_classes_limit: int
    """Maximum active group classes"""
    
    activity_manager_yet_to_start_cap: int
    """Maximum 'yet to start' items in activity manager"""
    
    activity_manager_in_progress_cap: int
    """Maximum 'in progress' items in activity manager"""
    
    classes_sessions_limit: int
    """Maximum total classes/sessions"""
    
    messages_retention_days: int
    """Chat history retention period in days"""
    
    # ── Future Limits (Phase 2+) ──────────────────────────────────────────────
    jobs_marketplace_applications_per_month: NotRequired[int]
    """Maximum job applications via marketplace per month (future)"""
    
    priority_matchmaking_weight: NotRequired[float]
    """Boost factor in Wolistic Teams matching algorithm (future)"""
    
    ai_routine_credits_per_month: NotRequired[int]
    """AI-assisted routine generations per month (future)"""
    
    custom_client_filters_limit: NotRequired[int]
    """Maximum saved custom client filters (future)"""
    
    feed_posts_per_week: NotRequired[int]
    """Maximum posts in public feed/gallery per week (future)"""
    
    client_showcase_slots: NotRequired[int]
    """Featured clients in /[username] public profile (future)"""
    
    # ── Feature Flags (Boolean Access Control) ────────────────────────────────
    can_reply_to_reviews: bool
    """Can respond to client reviews (all tiers: true)"""
    
    can_receive_reviews: bool
    """Can receive client reviews (all tiers: true)"""
    
    featured_in_search: bool
    """Boosted search ranking (Pro+)"""
    
    priority_support: bool
    """Access to priority customer support (Elite+)"""
    
    ai_routine_privacy: NotRequired[bool]
    """AI cannot read routines for suggestions (Celeb only)"""
    
    white_label_branding: NotRequired[bool]
    """Custom branding on client-facing pages (Celeb only)"""
    
    dedicated_account_manager: NotRequired[bool]
    """Personal account manager (Celeb only)"""
    
    brand_collaboration_priority: NotRequired[bool]
    """Priority brand partnership access (Elite+)"""
    
    # ── Multipliers (Performance Boosts) ──────────────────────────────────────
    coin_multiplier: float
    """Coin earn rate multiplier (1.0x = Free, 1.5x = Pro, 2.0x = Elite, 3.0x = Celeb)"""
    
    search_ranking_boost: float
    """Search result ranking boost multiplier"""
    
    review_weight_multiplier: float
    """Review credibility weight multiplier"""
