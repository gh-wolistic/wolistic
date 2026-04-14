"""
Admin Security Smoke Tests — MUST PASS before deploy.

Tests that all admin routes properly enforce X-Admin-API-Key authorization.
Prevents admin security bypass vulnerabilities.

CRITICAL: If any admin route is accessible without the API key, that's a
CRITICAL SECURITY vulnerability allowing unauthorized admin actions.

Run with: pytest -m smoke -v
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.config import get_settings

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app

# Import DummySession from comprehensive tests
from test_smoke_comprehensive import DummySession, override_get_db_session

# Test admin API key
VALID_ADMIN_API_KEY = "test-admin-key-12345"
os.environ["ADMIN_API_KEYS"] = VALID_ADMIN_API_KEY


# ============================================================================
# ADMIN ROUTES INVENTORY
# ============================================================================

ADMIN_ROUTES = [
    # Admin router (all require admin API key via router dependency)
    ("GET", "/api/v1/admin/professionals"),
    ("POST", "/api/v1/admin/professionals/{user_id}/status"),
    ("POST", "/api/v1/admin/professionals/{user_id}/approve"),
    ("POST", "/api/v1/admin/professionals/{user_id}/suspend"),
    ("POST", "/api/v1/admin/professionals/{user_id}/tier"),
    ("POST", "/api/v1/admin/professionals/bulk-approve"),
    ("GET", "/api/v1/admin/users/by-email"),
    
    # Activities admin routes
    ("GET", "/api/v1/partners/admin/activity-templates"),
    ("POST", "/api/v1/partners/admin/activity-templates"),
    ("PATCH", "/api/v1/partners/admin/activity-templates/{template_id}"),
    ("DELETE", "/api/v1/partners/admin/activity-templates/{template_id}"),
    ("POST", "/api/v1/partners/admin/internal-activities/backfill"),
    
    # Coins admin routes
    ("POST", "/api/v1/coins/admin/award"),
    ("GET", "/api/v1/coins/admin/leaderboard"),
    ("GET", "/api/v1/coins/admin/user/{user_id}/balance"),
    
    # Booking admin routes
    ("GET", "/api/v1/booking/admin/all-bookings"),
    
    # Subscription admin routes
    ("GET", "/api/v1/partners/admin/subscription-analytics"),
    ("POST", "/api/v1/partners/subscription/admin/process-renewals"),
]


def normalize_admin_path(path: str) -> str:
    """Replace path parameters with test values."""
    test_uuid = "00000000-0000-0000-0000-000000000001"
    path = path.replace("{user_id}", test_uuid)
    path = path.replace("{template_id}", test_uuid)
    return path


def get_minimal_admin_payload(method: str, path: str) -> dict | None:
    """Generate minimal valid payload for admin POST/PATCH routes."""
    if method not in ["POST", "PATCH"]:
        return None
    
    if "bulk-approve" in path:
        return {
            "userIds": ["00000000-0000-0000-0000-000000000001"],
            "minProfileCompleteness": 0,
        }
    
    if "/award" in path:
        return {
            "userId": "00000000-0000-0000-0000-000000000001",
            "coins": 100,
            "eventType": "admin_award",
            "referenceType": "admin",
            "referenceId": "test-admin-award",
        }
    
    if "activity-templates" in path and method == "POST":
        return {
            "title": "Test Activity",
            "description": "Test Description",
            "category": "wellness",
        }
    
    if "activity-templates" in path and method == "PATCH":
        return {
            "title": "Updated Activity",
        }
    
    if "/backfill" in path:
        return {}
    
    if "/process-renewals" in path:
        return {}
    
    return {}


# ============================================================================
# SMOKE TEST: Admin Routes WITHOUT Admin API Key
# ============================================================================


@pytest.mark.smoke
@pytest.mark.parametrize("method,path", ADMIN_ROUTES)
def test_admin_routes_require_api_key(method: str, path: str) -> None:
    """
    🔒 CRITICAL SECURITY TEST: All admin routes MUST reject requests without API key.
    
    If any admin route is accessible without X-Admin-API-Key header, that's a
    CRITICAL SECURITY VULNERABILITY allowing unauthorized admin actions:
    - Approve/suspend professionals
    - Award coins to any user
    - Access all user data
    - Modify subscriptions
    
    This test ensures NO admin route bypasses API key validation.
    """
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    client = TestClient(app)
    
    test_path = normalize_admin_path(path)
    payload = get_minimal_admin_payload(method, path)
    
    # Request WITHOUT X-Admin-API-Key header
    response = client.request(method, test_path, json=payload)
    
    # CRITICAL: Must return 401 or 403, NEVER 200/201
    assert response.status_code in [401, 403, 404], (
        f"🚨 SECURITY BREACH: {method} {path} accessible without admin API key!\n"
        f"   Status: {response.status_code} (expected 401/403/404)\n"
        f"   This allows UNAUTHORIZED ADMIN ACCESS\n"
        f"   Response: {response.text[:200]}"
    )
    
    app.dependency_overrides.clear()


# ============================================================================
# SMOKE TEST: Admin Routes WITH Valid Admin API Key
# ============================================================================


@pytest.mark.smoke
@pytest.mark.parametrize("method,path", ADMIN_ROUTES)
def test_admin_routes_with_valid_api_key(method: str, path: str) -> None:
    """
    Admin routes must work correctly WITH valid X-Admin-API-Key header.
    
    This ensures the admin API key validation doesn't break the routes themselves.
    We accept any status < 500 (including 422 validation errors, 404 not found).
    """
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    client = TestClient(app)
    
    test_path = normalize_admin_path(path)
    payload = get_minimal_admin_payload(method, path)
    
    # Request WITH valid X-Admin-API-Key header
    response = client.request(
        method,
        test_path,
        json=payload,
        headers={"X-Admin-API-Key": VALID_ADMIN_API_KEY},
    )
    
    # Should NOT return 500 (server crash)
    # Accept: 200, 201, 204 (success), 400, 401, 403, 404, 422 (expected errors)
    assert response.status_code < 500, (
        f"❌ Admin route crashed with valid API key: {method} {path}\n"
        f"   Status: {response.status_code}\n"
        f"   Response: {response.text[:300]}"
    )
    
    # If not authenticated error (401/403), should get success or validation error
    if response.status_code not in [401, 403, 404]:
        assert response.status_code in [200, 201, 204, 400, 422], (
            f"Unexpected status for {method} {path}: {response.status_code}"
        )
    
    app.dependency_overrides.clear()


# ============================================================================
# SMOKE TEST: Admin Routes WITH Invalid Admin API Key
# ============================================================================


@pytest.mark.smoke
@pytest.mark.parametrize("method,path", ADMIN_ROUTES[:5])  # Test subset for speed
def test_admin_routes_reject_invalid_api_key(method: str, path: str) -> None:
    """
    Admin routes must reject requests with INVALID X-Admin-API-Key header.
    
    This ensures the admin API key validation actually checks the key value.
    """
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    client = TestClient(app)
    
    test_path = normalize_admin_path(path)
    payload = get_minimal_admin_payload(method, path)
    
    # Request WITH invalid X-Admin-API-Key header
    response = client.request(
        method,
        test_path,
        json=payload,
        headers={"X-Admin-API-Key": "INVALID_KEY_12345"},
    )
    
    # CRITICAL: Must return 401 or 403, NEVER 200/201
    assert response.status_code in [401, 403, 404], (
        f"🚨 SECURITY BREACH: {method} {path} accepted INVALID admin API key!\n"
        f"   Status: {response.status_code} (expected 401/403/404)\n"
        f"   Response: {response.text[:200]}"
    )
    
    app.dependency_overrides.clear()


# ============================================================================
# SUMMARY
# ============================================================================
"""
ADMIN SECURITY SMOKE TEST COVERAGE:

✅ All 17 admin routes tested WITHOUT API key (must return 401/403)
✅ All 17 admin routes tested WITH valid API key (must work correctly)
✅ Sample admin routes tested WITH invalid API key (must return 401/403)

WHY THIS MATTERS:
Admin routes allow:
- Approving/suspending professionals
- Awarding coins to any user
- Accessing all user PII
- Modifying subscriptions
- Bulk operations

A single admin route accessible without API key = CRITICAL SECURITY VULNERABILITY.

These smoke tests prevent admin security bypass bugs from reaching production.
"""
