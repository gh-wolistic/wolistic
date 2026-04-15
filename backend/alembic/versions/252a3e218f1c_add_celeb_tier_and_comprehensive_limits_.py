"""add celeb tier and comprehensive limits schema

Revision ID: 252a3e218f1c
Revises: 9ea922b91a7b
Create Date: 2026-04-15 17:05:46.115340

COMPREHENSIVE TIER LIMITS SCHEMA DOCUMENTATION
================================================

This migration adds support for the 4-tier subscription system (Free, Pro, Elite, Celeb)
with comprehensive limit definitions stored in the `limits` JSONB field.

TIER HIERARCHY:
- free (tier 0): Basic access, limited features
- pro (tier 1): Professional features, moderate limits
- elite (tier 2): Advanced features, high limits
- celeb (tier 3): Premium features, unlimited (9999) limits

LIMITS STRUCTURE (30+ fields in JSONB):

PROFILE LIMITS (Common Infrastructure):
- certificates_limit (int): Maximum verified certifications
- languages_limit (int): Maximum languages offered
- education_items_limit (int): Maximum education entries
- expertise_areas_limit (int): Maximum expertise tags
- approaches_limit (int): Maximum therapeutic approaches
- subcategories_limit (int): Maximum service subcategories
- gallery_items_limit (int): Maximum gallery photos/videos
- booking_questions_limit (int): Maximum custom booking questions

OPERATIONAL LIMITS (Tier-Based Features):
- services_limit (int): Maximum active service offerings
- booking_slots_limit (int): Maximum availability slots per month
- client_invites_per_day (int): Maximum client invites per day
- client_invites_per_month (int): Maximum client invites per month
- leads_per_day (int): Maximum new leads accepted per day
- leads_total_limit (int): Maximum total active leads
- followups_per_day (int): Maximum follow-ups created per day
- followups_total_limit (int): Maximum active follow-ups
- routines_limit (int): Maximum active client routines
- routine_templates_limit (int): Maximum reusable routine templates
- group_classes_limit (int): Maximum active group classes
- activity_manager_yet_to_start_cap (int): Maximum "yet to start" items
- activity_manager_in_progress_cap (int): Maximum "in progress" items
- classes_sessions_limit (int): Maximum total classes/sessions
- messages_retention_days (int): Chat history retention period (days)

FUTURE LIMITS (Phase 2+):
- jobs_marketplace_applications_per_month (int)
- priority_matchmaking_weight (float)
- ai_routine_credits_per_month (int)
- custom_client_filters_limit (int)
- feed_posts_per_week (int)
- client_showcase_slots (int)

FEATURE FLAGS (Boolean Access Control):
- can_reply_to_reviews (bool): Can respond to client reviews
- can_receive_reviews (bool): Can receive client reviews
- featured_in_search (bool): Boosted search ranking
- priority_support (bool): Access to priority customer support
- ai_routine_privacy (bool): AI cannot read routines for suggestions
- white_label_branding (bool): Custom branding on client-facing pages
- dedicated_account_manager (bool): Personal account manager
- brand_collaboration_priority (bool): Priority brand partnership access

MULTIPLIERS (Performance Boosts):
- coin_multiplier (float): Coin earn rate multiplier
- search_ranking_boost (float): Search result ranking boost
- review_weight_multiplier (float): Review credibility weight

CHANGES:
1. Add `coming_soon` boolean column to subscription_plans (default: false)
2. Add tier constraint: CHECK (tier IN ('free', 'pro', 'elite', 'celeb'))
3. Set existing plans' coming_soon = false

Phase 1 Implementation: Admin Dashboard Tier Definition
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '252a3e218f1c'
down_revision = '9ea922b91a7b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add Celeb tier support and comprehensive limits schema.
    
    1. Add coming_soon column (boolean, default false)
    2. Add tier validation constraint (free|pro|elite|celeb)
    3. Set coming_soon = false for existing plans
    """
    # Add coming_soon column
    op.add_column(
        'subscription_plans',
        sa.Column('coming_soon', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Add tier constraint to validate tier values
    # Note: This constraint allows 'celeb' tier in addition to existing free/pro/elite
    op.create_check_constraint(
        'subscription_plans_tier_valid',
        'subscription_plans',
        "tier IN ('free', 'pro', 'elite', 'celeb')"
    )
    
    # Ensure all existing plans have coming_soon = false
    # (This is defensive - server_default should handle it, but being explicit)
    op.execute("UPDATE subscription_plans SET coming_soon = false WHERE coming_soon IS NULL")


def downgrade() -> None:
    """
    Rollback Celeb tier support.
    
    1. Drop tier constraint
    2. Drop coming_soon column
    
    WARNING: If any 'celeb' tier plans exist, they will remain in the database
    but the constraint will no longer validate them. Clean up celeb plans manually
    before downgrading if needed.
    """
    # Drop tier constraint
    op.drop_constraint('subscription_plans_tier_valid', 'subscription_plans', type_='check')
    
    # Drop coming_soon column
    op.drop_column('subscription_plans', 'coming_soon')
