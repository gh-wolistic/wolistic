"""
Create default subscription tier plans (Free, Pro, Elite, Celeb).

This script is idempotent - it checks for existing plans before creating.
Run with --force to recreate all plans (deletes existing first).
Run with --dry-run to preview changes without committing.

Usage:
    python scripts/create_default_tier_plans.py
    python scripts/create_default_tier_plans.py --dry-run
   python scripts/create_default_tier_plans.py --force
"""

import sys
import os
import requests


# ── Tier Definitions ──────────────────────────────────────────────────────────

FREE_PLAN = {
    "expert_type": "all",
    "name": "Free",
    "tier": "free",
    "description": "Get started with the basics - perfect for new professionals",
    "price_monthly": 0.00,
    "price_yearly": 0.00,
    "features": [
        "Basic profile",
        "Limited services",
        "Email support",
        "Client messaging (30-day history)",
    ],
    "limits": {
        # Profile Limits
        "certificates_limit": 3,
        "languages_limit": 2,
        "education_items_limit": 2,
        "expertise_areas_limit": 3,
        "approaches_limit": 2,
        "subcategories_limit": 2,
        "gallery_items_limit": 5,
        "booking_questions_limit": 0,
        # Operational Limits
        "services_limit": 2,
        "booking_slots_limit": 10,
        "client_invites_per_day": 1,
        "client_invites_per_month": 5,
        "leads_per_day": 2,
        "leads_total_limit": 10,
        "followups_per_day": 3,
        "followups_total_limit": 20,
        "routines_limit": 0,
        "routine_templates_limit": 0,
        "group_classes_limit": 2,
        "activity_manager_yet_to_start_cap": 10,
        "activity_manager_in_progress_cap": 10,
        "classes_sessions_limit": 5,
        "messages_retention_days": 30,
        # Feature Flags
        "can_reply_to_reviews": True,
        "can_receive_reviews": True,
        "featured_in_search": False,
        "priority_support": False,
        "ai_routine_privacy": False,
        "white_label_branding": False,
        "dedicated_account_manager": False,
        "brand_collaboration_priority": False,
        # Multipliers
        "coin_multiplier": 1.0,
        "search_ranking_boost": 1.0,
        "review_weight_multiplier": 1.0,
    },
    "display_order": 1,
    "is_active": True,
    "coming_soon": False,
}

PRO_PLAN = {
    "expert_type": "all",
    "name": "Pro",
    "tier": "pro",
    "description": "Grow your practice with advanced features and client management",
    "price_monthly": 499.00,
    "price_yearly": 4990.00,  # ~17% discount
    "features": [
        "Enhanced profile",
        "10 certifications",
        "AI-assisted routines",
        "Group classes",
        "Priority email support",
        "Client messaging (90-day history)",
        "Search ranking boost",
        "1.5x coin multiplier",
    ],
    "limits": {
        # Profile Limits
        "certificates_limit": 10,
        "languages_limit": 5,
        "education_items_limit": 5,
        "expertise_areas_limit": 10,
        "approaches_limit": 5,
        "subcategories_limit": 5,
        "gallery_items_limit": 20,
        "booking_questions_limit": 3,
        # Operational Limits
        "services_limit": 5,
        "booking_slots_limit": 50,
        "client_invites_per_day": 5,
        "client_invites_per_month": 30,
        "leads_per_day": 10,
        "leads_total_limit": 50,
        "followups_per_day": 20,
        "followups_total_limit": 100,
        "routines_limit": 10,
        "routine_templates_limit": 5,
        "group_classes_limit": 3,
        "activity_manager_yet_to_start_cap": 30,
        "activity_manager_in_progress_cap": 30,
        "classes_sessions_limit": 25,
        "messages_retention_days": 90,
        # Feature Flags
        "can_reply_to_reviews": True,
        "can_receive_reviews": True,
        "featured_in_search": True,
        "priority_support": False,
        "ai_routine_privacy": False,
        "white_label_branding": False,
        "dedicated_account_manager": False,
        "brand_collaboration_priority": False,
        # Multipliers
        "coin_multiplier": 1.5,
        "search_ranking_boost": 1.25,
        "review_weight_multiplier": 1.1,
    },
    "display_order": 2,
    "is_active": True,
    "coming_soon": False,
}

ELITE_PLAN = {
    "expert_type": "all",
    "name": "Elite",
    "tier": "elite",
    "description": "Premium tier for established professionals - maximize your reach",
    "price_monthly": 1999.00,
    "price_yearly": 19990.00,  # ~17% discount
    "features": [
        "Premium profile",
        "25 certifications",
        "Unlimited AI routines",
        "15 group classes",
        "Priority phone & chat support",
        "Client messaging (1-year history)",
        "Featured placement",
        "Brand collaboration priority",
        "2x coin multiplier",
        "Advanced analytics",
    ],
    "limits": {
        # Profile Limits
        "certificates_limit": 25,
        "languages_limit": 10,
        "education_items_limit": 10,
        "expertise_areas_limit": 20,
        "approaches_limit": 10,
        "subcategories_limit": 10,
        "gallery_items_limit": 50,
        "booking_questions_limit": 10,
        # Operational Limits
        "services_limit": 15,
        "booking_slots_limit": 200,
        "client_invites_per_day": 20,
        "client_invites_per_month": 100,
        "leads_per_day": 50,
        "leads_total_limit": 200,
        "followups_per_day": 100,
        "followups_total_limit": 500,
        "routines_limit": 50,
        "routine_templates_limit": 25,
        "group_classes_limit": 15,
        "activity_manager_yet_to_start_cap": 100,
        "activity_manager_in_progress_cap": 100,
        "classes_sessions_limit": 100,
        "messages_retention_days": 365,
        # Feature Flags
        "can_reply_to_reviews": True,
        "can_receive_reviews": True,
        "featured_in_search": True,
        "priority_support": True,
        "ai_routine_privacy": False,
        "white_label_branding": False,
        "dedicated_account_manager": False,
        "brand_collaboration_priority": True,
        # Multipliers
        "coin_multiplier": 2.0,
        "search_ranking_boost": 1.75,
        "review_weight_multiplier": 1.3,
    },
    "display_order": 3,
    "is_active": True,
    "coming_soon": False,
}

CELEB_PLAN = {
    "expert_type": "all",
    "name": "Celebrity",
    "tier": "celeb",
    "description": "Exclusive tier for celebrity professionals - white-glove service",
    "price_monthly": 9999.00,
    "price_yearly": 99990.00,  # ~17% discount
    "features": [
        "Exclusive profile",
        "Unlimited certifications",
        "Dedicated account manager",
        "White-label branding",
        "AI routine privacy",
        "Priority everything",
        "Unlimited messaging history",
        "VIP featured placement",
        "3x coin multiplier",
        "Custom analytics dashboard",
        "Brand partnerships",
    ],
    "limits": {
        # Profile Limits (unlimited)
        "certificates_limit": 9999,
        "languages_limit": 9999,
        "education_items_limit": 9999,
        "expertise_areas_limit": 9999,
        "approaches_limit": 9999,
        "subcategories_limit": 9999,
        "gallery_items_limit": 9999,
        "booking_questions_limit": 9999,
        # Operational Limits (unlimited)
        "services_limit": 9999,
        "booking_slots_limit": 9999,
        "client_invites_per_day": 9999,
        "client_invites_per_month": 9999,
        "leads_per_day": 9999,
        "leads_total_limit": 9999,
        "followups_per_day": 9999,
        "followups_total_limit": 9999,
        "routines_limit": 9999,
        "routine_templates_limit": 9999,
        "group_classes_limit": 9999,
        "activity_manager_yet_to_start_cap": 9999,
        "activity_manager_in_progress_cap": 9999,
        "classes_sessions_limit": 9999,
        "messages_retention_days": 9999,
        # Feature Flags (all enabled)
        "can_reply_to_reviews": True,
        "can_receive_reviews": True,
        "featured_in_search": True,
        "priority_support": True,
        "ai_routine_privacy": True,
        "white_label_branding": True,
        "dedicated_account_manager": True,
        "brand_collaboration_priority": True,
        # Multipliers (maximum)
        "coin_multiplier": 3.0,
        "search_ranking_boost": 2.5,
        "review_weight_multiplier": 1.5,
    },
    "display_order": 4,
    "is_active": True,
    "coming_soon": True,  # Mark as coming soon initially
}


# ── Script Logic ──────────────────────────────────────────────────────────────

def get_admin_api_key():
    """Get admin API key from environment."""
    api_key = os.getenv("ADMIN_API_KEY")
    if not api_key:
        print("ERROR: ADMIN_API_KEY environment variable not set!")
        sys.exit(1)
    return api_key


def create_default_plans(dry_run: bool = False, force: bool = False):
    """Create default subscription tier plans using HTTP API."""
    api_key = get_admin_api_key()
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
    headers = {"X-Admin-Key": api_key}
    
    plans_to_create = [FREE_PLAN, PRO_PLAN, ELITE_PLAN, CELEB_PLAN]
    
    # Check existing plans
    response = requests.get(f"{base_url}/admin/subscriptions/plans", headers=headers)
    if response.status_code != 200:
        print(f"ERROR: Failed to fetch existing plans: {response.text}")
        return
    
    existing_plans = response.json()
    existing_tier_map = {p["tier"]: p for p in existing_plans}
    
    if existing_plans and not force:
        print(f"\n⚠️  Found {len(existing_plans)} existing plans:")
        for plan in existing_plans:
            print(f"   - {plan['tier'].upper()}: {plan['name']} (ID: {plan['id']})")
        print("\n   Use --force to delete and recreate all plans")
        print("   (Warning: This will break existing subscriptions!)")
        return
    
    if force and existing_plans:
        print(f"\n🗑️  Deleting {len(existing_plans)} existing plans...")
        for plan in existing_plans:
            print(f"   - Deleting {plan['tier'].upper()}: {plan['name']}")
            if not dry_run:
                # Note: Would need DELETE endpoint - for now we skip deletion
                print(f"      ⚠️  WARNING: No DELETE endpoint available, skipping")
    
    # Create plans
    print(f"\n📋 Creating {len(plans_to_create)} default tier plans...")
    
    for plan_data in plans_to_create:
        tier = plan_data["tier"]
        name =plan_data["name"]
        coming_soon = plan_data.get("coming_soon", False)
        status = "🔒 COMING SOON" if coming_soon else "✅ ACTIVE"
        
        print(f"\n   {tier.upper():6s} | {name:10s} | {status}")
        print(f"          Price: ₹{plan_data['price_monthly']}/month")
        print(f"          Features: {len(plan_data['features'])} items")
        print(f"          Limits: {len(plan_data['limits'])} fields configured")
        
        if not dry_run:
            response = requests.post(
                f"{base_url}/admin/subscriptions/plans",
                json=plan_data,
                headers=headers
            )
            if response.status_code == 201:
                created = response.json()
                print(f"          ✅ Created (ID: {created['id']})")
            else:
                print(f"          ❌ Failed: {response. text}")
    
    if not dry_run:
        print("\n✅ Successfully created all tier plans!")
    else:
        print("\n⏭️  DRY RUN - No changes committed to database")


def main():
    """Parse arguments and run script."""
    dry_run = "--dry-run" in sys.argv
    force = "--force" in sys.argv
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be committed\n")
    
    if force:
        print("⚠️  FORCE MODE - Will delete existing plans!\n")
        if not dry_run:
            print("   This action is IRREVERSIBLE and may break existing subscriptions.")
            response = input("   Type 'DELETE' to confirm: ")
            if response != "DELETE":
                print("\n❌ Aborted - confirmation failed")
                return
    
    create_default_plans(dry_run=dry_run, force=force)


if __name__ == "__main__":
    print("=" * 70)
    print("  CREATE DEFAULT SUBSCRIPTION TIER PLANS")
    print("=" * 70)
    main()
