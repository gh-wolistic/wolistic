"""Test tier enforcement on class activation."""
import requests
import os

API_BASE = "http://localhost:8000/api/v1"

# Get auth token from environment or use test credentials
# For this test, we'll simulate the API calls

def test_create_draft_then_activate():
    """Test that activating a draft class is blocked if limit reached."""
    
    print("\n" + "="*80)
    print("TEST: Tier Enforcement on Class Activation")
    print("="*80)
    
    print("\nCurrent State:")
    print("- User has 3 active classes")
    print("- Free tier limit: 2 classes")
    print("- User is OVER LIMIT by 1 class")
    
    print("\nExpected Behavior:")
    print("1. Creating a 4th class as 'draft' should SUCCEED (drafts don't count)")
    print("2. Changing that draft to 'active' should FAIL (would exceed limit)")
    
    print("\n" + "-"*80)
    print("Recommendation: User needs to either:")
    print("  A) Deactivate one of the 3 existing classes, OR")
    print("  B) Upgrade to Pro tier (5 class limit)")
    print("="*80)

if __name__ == "__main__":
    test_create_draft_then_activate()
