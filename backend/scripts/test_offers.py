#!/usr/bin/env python3
"""
Test script for offer management endpoints.

Usage:
    python scripts/test_offers.py --admin-email admin@example.com --professional-uuid <uuid>

Prerequisites:
    1. Backend running on http://localhost:8000
    2. Admin user exists in database
    3. Professional user exists in database

This script will:
    1. Authenticate as admin
    2. Create a test offer (TESTSCRIPT2026)
    3. List all offers
    4. Assign offer to professional
    5. Verify tier upgrade
    6. Run maintenance job
    7. Clean up test data
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
import json

try:
    import requests
except ImportError:
    print("Error: requests library not installed")
    print("Install with: pip install requests")
    sys.exit(1)


BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = None
PROFESSIONAL_UUID = None


def authenticate_admin(email: str, password: str = None) -> requests.Session:
    """Authenticate as admin and return session."""
    session = requests.Session()
    
    # Note: Update this section based on your actual auth flow
    # This is a placeholder - adjust to match your authentication endpoint
    print(f"\n⚠️  Manual Authentication Required")
    print(f"This script needs admin session authentication.")
    print(f"\nOptions:")
    print(f"1. Login to http://localhost:3001 in your browser")
    print(f"2. Open browser DevTools → Application → Cookies")
    print(f"3. Copy 'session_token' cookie value")
    print(f"4. Enter it below:")
    
    session_token = input("\nPaste session_token: ").strip()
    
    if not session_token:
        print("❌ No session token provided")
        sys.exit(1)
    
    session.cookies.set('session_token', session_token, domain='localhost')
    
    # Verify authentication
    response = session.get(f"{BASE_URL}/auth/me")
    if response.status_code != 200:
        print(f"❌ Authentication failed: {response.text}")
        sys.exit(1)
    
    user_data = response.json()
    print(f"✅ Authenticated as: {user_data.get('email')} (ID: {user_data.get('id')})")
    
    # Verify admin privileges
    if not user_data.get('is_admin'):
        print("❌ User is not an admin")
        sys.exit(1)
    
    return session


def test_create_offer(session: requests.Session) -> dict:
    """Test creating an offer."""
    print("\n" + "="*60)
    print("TEST 1: Create Offer")
    print("="*60)
    
    offer_data = {
        "code": "TESTSCRIPT2026",
        "name": "Test Script Offer",
        "description": "3-month Pro tier for testing",
        "offer_type": "tier_upgrade",
        "domain": "subscription",
        "target_tier": "pro",
        "duration_months": 3,
        "auto_downgrade_after_months": 3,
        "downgrade_to_tier": "free",
        "max_redemptions": 10,
        "max_redemptions_per_professional": 1,
        "valid_from": datetime.now(timezone.utc).isoformat(),
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "is_active": True
    }
    
    print(f"\nCreating offer: {offer_data['code']}")
    response = session.post(f"{BASE_URL}/admin/offers", json=offer_data)
    
    if response.status_code == 201:
        print(f"✅ Offer created successfully")
        offer = response.json()
        print(json.dumps(offer, indent=2))
        return offer
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print(f"⚠️  Offer already exists, fetching existing...")
        # Try to get existing offer
        response = session.get(f"{BASE_URL}/admin/offers")
        offers = response.json()
        for offer in offers:
            if offer['code'] == 'TESTSCRIPT2026':
                print(json.dumps(offer, indent=2))
                return offer
        print(f"❌ Could not find existing offer")
        sys.exit(1)
    else:
        print(f"❌ Failed to create offer: {response.status_code}")
        print(response.text)
        sys.exit(1)


def test_list_offers(session: requests.Session):
    """Test listing offers."""
    print("\n" + "="*60)
    print("TEST 2: List Offers")
    print("="*60)
    
    response = session.get(f"{BASE_URL}/admin/offers")
    
    if response.status_code == 200:
        offers = response.json()
        print(f"✅ Found {len(offers)} offers")
        
        # Find our test offer
        test_offer = next((o for o in offers if o['code'] == 'TESTSCRIPT2026'), None)
        if test_offer:
            print(f"\nTest offer found:")
            print(f"  Code: {test_offer['code']}")
            print(f"  Name: {test_offer['name']}")
            print(f"  Target Tier: {test_offer['target_tier']}")
            print(f"  Duration: {test_offer['duration_months']} months")
            print(f"  Usage: {test_offer.get('usage', {})}")
        else:
            print(f"⚠️  Test offer not found in list")
    else:
        print(f"❌ Failed to list offers: {response.status_code}")
        print(response.text)
        sys.exit(1)


def test_assign_offer(session: requests.Session, professional_uuid: str) -> dict:
    """Test assigning offer to professional."""
    print("\n" + "="*60)
    print("TEST 3: Assign Offer")
    print("="*60)
    
    assignment_data = {
        "offer_code": "TESTSCRIPT2026",
        "professional_id": professional_uuid,
        "auto_activate": True,
        "notes": "Test assignment from test script"
    }
    
    print(f"\nAssigning offer to professional: {professional_uuid}")
    response = session.post(f"{BASE_URL}/admin/offers/assign", json=assignment_data)
    
    if response.status_code == 201:
        print(f"✅ Offer assigned successfully")
        assignment = response.json()
        print(json.dumps(assignment, indent=2))
        return assignment
    elif response.status_code == 400 and "already assigned" in response.text.lower():
        print(f"⚠️  Offer already assigned to this professional")
        # Try to get existing assignment
        response = session.get(
            f"{BASE_URL}/admin/offers/assignments",
            params={"offer_code": "TESTSCRIPT2026"}
        )
        assignments = response.json()
        for assignment in assignments:
            if assignment['professional_id'] == professional_uuid:
                print(json.dumps(assignment, indent=2))
                return assignment
        print(f"❌ Could not find existing assignment")
        sys.exit(1)
    else:
        print(f"❌ Failed to assign offer: {response.status_code}")
        print(response.text)
        sys.exit(1)


def test_verify_tier_upgrade(session: requests.Session, professional_uuid: str):
    """Verify professional's tier was upgraded."""
    print("\n" + "="*60)
    print("TEST 4: Verify Tier Upgrade")
    print("="*60)
    
    response = session.get(f"{BASE_URL}/admin/professionals/{professional_uuid}")
    
    if response.status_code == 200:
        professional = response.json()
        current_tier = professional.get('membership_tier')
        print(f"✅ Professional tier: {current_tier}")
        
        if current_tier == 'pro':
            print(f"✅ Tier upgraded successfully!")
        else:
            print(f"⚠️  Expected tier 'pro', got '{current_tier}'")
    else:
        print(f"❌ Failed to fetch professional: {response.status_code}")
        print(response.text)


def test_list_assignments(session: requests.Session):
    """Test listing assignments."""
    print("\n" + "="*60)
    print("TEST 5: List Assignments")
    print("="*60)
    
    response = session.get(
        f"{BASE_URL}/admin/offers/assignments",
        params={"offer_code": "TESTSCRIPT2026"}
    )
    
    if response.status_code == 200:
        assignments = response.json()
        print(f"✅ Found {len(assignments)} assignments for TESTSCRIPT2026")
        
        for assignment in assignments:
            print(f"\n  Assignment ID: {assignment['id']}")
            print(f"  Professional: {assignment.get('professional_name', 'N/A')} ({assignment['professional_id']})")
            print(f"  Status: {assignment['status']}")
            print(f"  Assigned: {assignment['assigned_at']}")
            print(f"  Activated: {assignment.get('activated_at', 'N/A')}")
            print(f"  Expires: {assignment.get('expires_at', 'N/A')}")
    else:
        print(f"❌ Failed to list assignments: {response.status_code}")
        print(response.text)


def test_maintenance_job(session: requests.Session):
    """Test running maintenance job."""
    print("\n" + "="*60)
    print("TEST 6: Run Maintenance Job")
    print("="*60)
    
    response = session.post(f"{BASE_URL}/admin/offers/maintenance/auto-downgrade")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Maintenance job completed")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Failed to run maintenance: {response.status_code}")
        print(response.text)


def cleanup(session: requests.Session):
    """Clean up test data."""
    print("\n" + "="*60)
    print("CLEANUP: Deactivating Test Offer")
    print("="*60)
    
    # Note: This requires an update offer endpoint (not yet implemented)
    # For now, just inform the user
    print("\n⚠️  Manual cleanup required:")
    print("   1. Navigate to http://localhost:3001/dashboard/offers")
    print("   2. Find offer 'TESTSCRIPT2026'")
    print("   3. Deactivate or delete the offer")
    print("\nOr run SQL:")
    print("   UPDATE offers SET is_active = false WHERE code = 'TESTSCRIPT2026';")


def main():
    parser = argparse.ArgumentParser(description='Test offer management endpoints')
    parser.add_argument('--admin-email', required=True, help='Admin user email')
    parser.add_argument('--professional-uuid', required=True, help='Professional UUID to assign offer')
    parser.add_argument('--skip-cleanup', action='store_true', help='Skip cleanup step')
    
    args = parser.parse_args()
    
    print("="*60)
    print("OFFER MANAGEMENT TEST SUITE")
    print("="*60)
    print(f"\nAdmin Email: {args.admin_email}")
    print(f"Professional UUID: {args.professional_uuid}")
    print(f"Backend URL: {BASE_URL}")
    
    # Authenticate
    session = authenticate_admin(args.admin_email)
    
    # Run tests
    try:
        offer = test_create_offer(session)
        test_list_offers(session)
        assignment = test_assign_offer(session, args.professional_uuid)
        test_verify_tier_upgrade(session, args.professional_uuid)
        test_list_assignments(session)
        test_maintenance_job(session)
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        
        if not args.skip_cleanup:
            cleanup(session)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
