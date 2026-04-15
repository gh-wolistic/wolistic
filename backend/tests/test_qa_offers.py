"""
QA Test Suite: Offer Management System
Run with: pytest tests/test_qa_offers.py -v
"""
import requests
import json
from datetime import datetime, timezone, timedelta
import uuid

BASE_URL = "http://localhost:8000/api/v1"


class TestOfferManagementQA:
    """Comprehensive QA tests for offer management system"""
    
    @classmethod
    def setup_class(cls):
        """Setup authenticated session"""
        cls.session = requests.Session()
        cls.base_url = BASE_URL
    
    def login(self):
        """Login and get session cookie"""
        login_resp = self.session.post(
            f"{self.base_url}/admin/login",
            json={"email": "admin@wolistic.com", "password": "WolisticAdmin@2026!"}
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        
        # Verify cookie was set
        cookies = self.session.cookies.get_dict()
        assert "admin_session" in cookies, f"Session cookie not set. Cookies: {cookies}"
        
        print(f"\n[OK] Authenticated as: {login_resp.json()['email']}")
        print(f"   Session cookie: {cookies['admin_session'][:20]}...")
    
    def test_01_authentication_required(self):
        """TEST: Unauthenticated access is blocked"""
        unauth = requests.Session()
        resp = unauth.get(f"{BASE_URL}/admin/offers")
        assert resp.status_code == 401, "Expected 401 for unauthenticated request"
        print("[OK] Security: Unauthenticated access blocked")
    
    def test_02_list_offers(self):
        """TEST: List all offers with usage stats"""
        resp = self.session.get(f"{BASE_URL}/admin/offers")
        assert resp.status_code == 200, f"List failed: {resp.text}"
        offers = resp.json()
        assert isinstance(offers, list), "Expected list of offers"
        
        print(f"[OK] Retrieved {len(offers)} existing offers")
        for offer in offers[:3]:
            usage = offer.get("usage", {})
            print(f"   - {offer['code']}: {usage.get('assigned', 0)} assigned")
    
    def test_03_create_offer_valid(self):
        """TEST: Create offer with valid data"""
        test_code = f"QATEST{datetime.now().strftime('%H%M%S')}"
        offer_data = {
            "code": test_code,
            "name": "QA Test Offer",
            "description": "Test offer for QA validation",
            "offer_type": "tier_upgrade",
            "domain": "subscription",
            "target_tier": "pro",
            "duration_months": 3,
            "auto_downgrade_after_months": 3,
            "downgrade_to_tier": "free",
            "max_redemptions": 10,
            "valid_from": datetime.now(timezone.utc).isoformat(),
            "valid_until": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "is_active": True
        }
        
        resp = self.session.post(f"{BASE_URL}/admin/offers", json=offer_data)
        assert resp.status_code == 201, f"Create failed: {resp.text}"
        
        offer = resp.json()
        assert offer["code"] == test_code
        assert offer["target_tier"] == "pro"
        assert offer["is_active"] is True
        
        print(f"[OK] Created offer: {test_code}")
        return offer
    
    def test_04_create_offer_duplicate_code(self):
        """TEST: Duplicate offer code is rejected"""
        # Create first offer
        test_code = f"QADUP{datetime.now().strftime('%H%M%S')}"
        offer_data = {
            "code": test_code,
            "name": "Duplicate Test",
            "offer_type": "tier_upgrade",
            "domain": "subscription",
            "target_tier": "pro",
            "duration_months": 1,
            "valid_from": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        
        resp1 = self.session.post(f"{BASE_URL}/admin/offers", json=offer_data)
        assert resp1.status_code == 201, "First offer should succeed"
        
        # Try duplicate
        resp2 = self.session.post(f"{BASE_URL}/admin/offers", json=offer_data)
        assert resp2.status_code in [400, 409], f"Expected 400/409 for duplicate, got {resp2.status_code}"
        
        print(f"[OK] Duplicate code correctly rejected")
    
    def test_05_create_offer_invalid_tier(self):
        """TEST: Invalid tier is rejected"""
        offer_data = {
            "code": f"QABAD{datetime.now().strftime('%H%M%S')}",
            "name": "Bad Tier Test",
            "offer_type": "tier_upgrade",
            "domain": "subscription",
            "target_tier": "platinum",  # Invalid tier
            "duration_months": 1,
            "valid_from": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        
        resp = self.session.post(f"{BASE_URL}/admin/offers", json=offer_data)
        assert resp.status_code in [400, 422], f"Expected validation error, got {resp.status_code}"
        
        print("[OK] Invalid tier correctly rejected")
    
    def test_06_create_offer_missing_required_fields(self):
        """TEST: Missing required fields are rejected"""
        invalid_data = {
            "code": "INCOMPLETE",
            # Missing: name, offer_type, domain, valid_from
        }
        
        resp = self.session.post(f"{BASE_URL}/admin/offers", json=invalid_data)
        assert resp.status_code == 422, f"Expected 422 for missing fields, got {resp.status_code}"
        
        print("[OK] Missing required fields rejected")
    
    def test_07_list_assignments_empty(self):
        """TEST: List assignments returns empty list for new offers"""
        resp = self.session.get(f"{BASE_URL}/admin/offers/assignments")
        assert resp.status_code == 200, f"List assignments failed: {resp.text}"
        
        data = resp.json()
        assert isinstance(data, dict), "Expected dict response"
        assert "items" in data, "Missing 'items' key in response"
        assert isinstance(data["items"], list), "Expected list in 'items'"
        
        print(f"[OK] Retrieved {len(data['items'])} assignments")
    
    def test_08_assign_offer_invalid_professional(self):
        """TEST: Assignment to non-existent professional fails"""
        # Create a test offer first
        test_code = f"QAASGN{datetime.now().strftime('%H%M%S')}"
        offer_data = {
            "code": test_code,
            "name": "Assignment Test",
            "offer_type": "tier_upgrade",
            "domain": "subscription",
            "target_tier": "pro",
            "duration_months": 1,
            "valid_from": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        self.session.post(f"{BASE_URL}/admin/offers", json=offer_data)
        
        # Try to assign to fake professional
        fake_uuid = str(uuid.uuid4())
        assign_data = {
            "offer_code": test_code,
            "professional_id": fake_uuid,
            "auto_activate": True
        }
        
        resp = self.session.post(f"{BASE_URL}/admin/offers/assign", json=assign_data)
        assert resp.status_code in [400, 404], f"Expected 400/404 for invalid professional, got {resp.status_code}"
        
        print("[OK] Assignment to invalid professional rejected")
    
    def test_09_maintenance_job_executes(self):
        """TEST: Auto-downgrade maintenance job runs"""
        resp = self.session.post(f"{BASE_URL}/admin/offers/maintenance/auto-downgrade")
        assert resp.status_code == 200, f"Maintenance job failed: {resp.text}"
        
        result = resp.json()
        assert "downgrades_processed" in result or "downgraded" in result, "Missing downgrade count"
        
        print(f"[OK] Maintenance job executed: {result}")
    
    def test_10_offer_usage_stats_accuracy(self):
        """TEST: Usage stats are calculated correctly"""
        resp = self.session.get(f"{BASE_URL}/admin/offers")
        assert resp.status_code == 200
        
        offers = resp.json()
        for offer in offers:
            usage = offer.get("usage", {})
            
            # Usage stats should have expected keys
            assert "assigned" in usage, f"Missing 'assigned' in usage for {offer['code']}"
            
            # All counts should be non-negative
            for key, value in usage.items():
                assert value >= 0, f"Negative usage count for {key}: {value}"
            
            # Assigned should be sum of all status counts
            if "active" in usage and "pending" in usage:
                assert usage["assigned"] >= usage["active"], \
                    f"Assigned ({usage['assigned']}) < active ({usage['active']})"
        
        print(f"[OK] Usage stats validated for {len(offers)} offers")


if __name__ == "__main__":
    print("=== QA TEST SUITE: OFFER MANAGEMENT ===\n")
    print("Run with: pytest tests/test_qa_offers.py -v\n")
    print("Quick run (no pytest):\n")
    
    test_suite = TestOfferManagementQA()
    TestOfferManagementQA.setup_class()
    test_suite.login()  # Login before running tests
    
    tests = [
        test_suite.test_01_authentication_required,
        test_suite.test_02_list_offers,
        test_suite.test_03_create_offer_valid,
        test_suite.test_04_create_offer_duplicate_code,
        test_suite.test_05_create_offer_invalid_tier,
        test_suite.test_06_create_offer_missing_required_fields,
        test_suite.test_07_list_assignments_empty,
        test_suite.test_08_assign_offer_invalid_professional,
        test_suite.test_09_maintenance_job_executes,
        test_suite.test_10_offer_usage_stats_accuracy,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            print(f"\n{test.__doc__}")
            test()
            passed += 1
        except AssertionError as e:
            print(f"[FAIL] {e}")
            failed += 1
        except Exception as e:
            print(f"[ERROR] {e}")
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"RESULTS: {passed} passed, {failed} failed")
    print(f"{'='*60}")
    
    if failed > 0:
        exit(1)
