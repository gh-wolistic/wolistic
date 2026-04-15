"""Test the professionals API endpoint"""
import asyncio
import httpx


async def test_api():
    # Test without auth (should fail)
    print("=== Testing /admin/professionals endpoint ===\n")
    
    base_url = "http://localhost:8000/api/v1"
    
    # Test 1: All professionals, all tiers
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{base_url}/admin/professionals",
            params={"status": "all", "tier": "all", "limit": 50},
            cookies={"admin_session": "fake"},  # This will fail auth
        )
        print(f"Test 1 (no auth): status={response.status_code}")
        if response.status_code == 401:
            print("  ✓ Correctly requires authentication")
        else:
            print(f"  Response: {response.text[:200]}")
    
    print("\nNote: You need a valid admin session cookie to test further.")
    print("To get a valid session, login via the admin panel first.")


if __name__ == "__main__":
    asyncio.run(test_api())
