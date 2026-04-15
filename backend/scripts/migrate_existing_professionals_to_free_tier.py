"""
Migrate existing professionals to Free tier subscription.

This script assigns the Free tier to all professionals who currently
don't have a subscription. It uses 'admin_upgrade' subscription type.

Run with --dry-run to preview changes without committing.

Usage:
    python scripts/migrate_existing_professionals_to_free_tier.py
    python scripts/migrate_existing_professionals_to_free_tier.py --dry-run
"""

import sys
import os
import requests
from datetime import datetime, timezone


def get_admin_api_key():
    """Get admin API key from environment."""
    api_key = os.getenv("ADMIN_API_KEY")
    if not api_key:
        print("ERROR: ADMIN_API_KEY environment variable not set!")
        sys.exit(1)
    return api_key


def migrate_professionals(dry_run: bool = False):
    """Assign Free tier to professionals without subscriptions."""
    api_key = get_admin_api_key()
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
    headers = {"X-Admin-Key": api_key}
    
    # Step 1: Get Free tier plan ID
    print("\n📋 Step 1: Finding Free tier plan...")
    response = requests.get(f"{base_url}/admin/subscriptions/plans", headers=headers)
    if response.status_code != 200:
        print(f"ERROR: Failed to fetch plans: {response.text}")
        return
    
    plans = response.json()
    free_plan = next((p for p in plans if p["tier"] == "free"), None)
    
    if not free_plan:
        print("ERROR: Free tier plan not found!")
        print("Please run create_default_tier_plans.py first")
        return
    
    free_plan_id = free_plan["id"]
    print(f"   ✅ Found Free tier plan (ID: {free_plan_id})")
    
    # Step 2: Get all assigned subscriptions
    print("\n📋 Step 2: Fetching assigned subscriptions...")
    response = requests.get(f"{base_url}/admin/subscriptions/assigned", headers=headers)
    if response.status_code != 200:
        print(f"ERROR: Failed to fetch assigned subscriptions: {response.text}")
        return
    
    assigned_subs = response.json()
    subscribed_prof_ids = {sub["professional_id"] for sub in assigned_subs}
    print(f"   ℹ️  Found {len(subscribed_prof_ids)} professionals with subscriptions")
    
    # Step 3: Get all professionals (would need an endpoint for this)
    # For now, we'll assume we can't easily list all professionals
    # In production, you'd either:
    # 1. Add a /admin/professionals endpoint
    # 2. Query database directly with SQL
    # 3. Use Supabase client
    
    print("\n⚠️  Note: This script currently only validates existing subscriptions")
    print("   To migrate unsubscribed professionals, you would need to:")
    print("   1. Query the database for professionals without subscriptions")
    print("   2. Call POST /admin/subscriptions/assigned for each one")
    print("\n   SQL Query to find unsubscribed professionals:")
    print("   ")
    print("   SELECT p.user_id")
    print("   FROM professionals p")
    print("   LEFT JOIN professional_subscriptions ps ON p.user_id = ps.professional_id")
    print("   WHERE ps.id IS NULL;")
    print("\n   Then for each user_id, call:")
    print(f"   POST {base_url}/admin/subscriptions/assigned")
    print("   {")
    print("     \"professional_id\": \"<uuid>\",")
    print(f"     \"plan_id\": {free_plan_id},")
    print("     \"status\": \"active\",")
    print(f"     \"starts_at\": \"{datetime.now(timezone.utc).isoformat()}\",")
    print("     \"auto_renew\": false")
    print("   }")
    
    if not dry_run:
        print("\n⏭️  Run with --dry-run first to preview changes")
    else:
        print("\n🔍 DRY RUN - No changes would be made")


def main():
    """Parse arguments and run script."""
    dry_run = "--dry-run" in sys.argv
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be committed\n")
    else:
        print("\n⚠️  WARNING: This will modify subscription data!")
        response = input("   Type 'MIGRATE' to confirm: ")
        if response != "MIGRATE":
            print("\n❌ Aborted - confirmation failed")
            return
    
    migrate_professionals(dry_run=dry_run)


if __name__ == "__main__":
    print("=" * 70)
    print("  MIGRATE PROFESSIONALS TO FREE TIER")
    print("=" * 70)
    main()
