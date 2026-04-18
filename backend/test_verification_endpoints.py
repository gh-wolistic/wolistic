"""
Test script for Professional Verification System endpoints.

Tests all verification endpoints to ensure Stage 3 implementation is working.

Usage:
    python test_verification_endpoints.py

Prerequisites:
    - Backend running on http://localhost:8000
    - Valid Supabase JWT token for a professional user
    - Admin API key set in environment
"""
import asyncio
import os
import sys
from datetime import date, datetime, timedelta
from uuid import uuid4

import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_BASE_URL = "http://localhost:8000/api/v1/admin"

# Test credentials (you'll need to provide these)
PROFESSIONAL_TOKEN = os.getenv("TEST_PROFESSIONAL_TOKEN", "")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name: str):
    """Print test name."""
    print(f"\n{BLUE}━━━ Testing: {name} ━━━{RESET}")


def print_success(message: str):
    """Print success message."""
    print(f"{GREEN}✓ {message}{RESET}")


def print_error(message: str):
    """Print error message."""
    print(f"{RED}✗ {message}{RESET}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{YELLOW}⚠ {message}{RESET}")


def print_response(response: httpx.Response):
    """Print response details."""
    print(f"  Status: {response.status_code}")
    if response.status_code >= 400:
        print(f"  Error: {response.text[:200]}")
    else:
        print(f"  Response: {response.json() if response.text else 'Empty'}")


async def test_professional_endpoints():
    """Test professional verification endpoints."""
    if not PROFESSIONAL_TOKEN:
        print_warning("Skipping professional tests - no TEST_PROFESSIONAL_TOKEN in .env")
        print("To test professional endpoints, add a valid Supabase JWT token to .env:")
        print("  TEST_PROFESSIONAL_TOKEN=eyJhbGc...")
        return

    headers = {"Authorization": f"Bearer {PROFESSIONAL_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Get verification status
        print_test("GET /professionals/me/verification/status")
        try:
            response = await client.get(
                f"{BASE_URL}/professionals/me/verification/status",
                headers=headers
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success("Status endpoint working")
                print(f"  Identity verified: {data.get('identity_verified', False)}")
                print(f"  Credentials count: {data.get('credentials_count', 0)}")
                print(f"  Can appear in search: {data.get('can_appear_in_search', False)}")
            else:
                print_error(f"Status endpoint failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 2: Request upload URL for identity document
        print_test("POST /professionals/me/verification/upload-url (identity)")
        try:
            response = await client.post(
                f"{BASE_URL}/professionals/me/verification/upload-url",
                headers=headers,
                json={
                    "bucket": "professional-identity-documents",
                    "file_extension": "pdf"
                }
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success("Upload URL generated")
                print(f"  Bucket: {data.get('bucket')}")
                print(f"  File path: {data.get('file_path')}")
                print(f"  Expires: {data.get('expires_at')}")
            else:
                print_error(f"Upload URL failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 3: Submit identity verification
        print_test("POST /professionals/me/verification/identity")
        try:
            # Generate a test file path (in real usage, this would come from actual upload)
            user_id = str(uuid4())
            test_file_path = f"{user_id}/20260418_test_aadhaar.pdf"
            
            response = await client.post(
                f"{BASE_URL}/professionals/me/verification/identity",
                headers=headers,
                json={
                    "document_type": "aadhaar",
                    "document_url": test_file_path
                }
            )
            print_response(response)
            
            if response.status_code in [200, 201]:
                data = response.json()
                print_success("Identity verification submitted")
                print(f"  User ID: {data.get('user_id')}")
                print(f"  Status: {data.get('verification_status')}")
                print(f"  Document type: {data.get('document_type')}")
            elif response.status_code == 409:
                print_warning("Identity already verified (expected if re-running test)")
            else:
                print_error(f"Identity submit failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 4: Get identity verification status
        print_test("GET /professionals/me/verification/identity")
        try:
            response = await client.get(
                f"{BASE_URL}/professionals/me/verification/identity",
                headers=headers
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success("Identity status retrieved")
                print(f"  Status: {data.get('verification_status')}")
                if data.get('rejection_reason'):
                    print(f"  Rejection reason: {data.get('rejection_reason')}")
            else:
                print_error(f"Identity status failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 5: Submit credential verification
        print_test("POST /professionals/me/verification/credentials")
        try:
            test_file_path = f"{user_id}/20260418_test_degree.pdf"
            
            response = await client.post(
                f"{BASE_URL}/professionals/me/verification/credentials",
                headers=headers,
                json={
                    "credential_type": "education",
                    "credential_subtype": "bachelors",
                    "credential_name": "BSc Nutrition & Dietetics",
                    "issuing_organization": "University of Mumbai",
                    "issued_date": "2018-05-15",
                    "document_url": test_file_path
                }
            )
            print_response(response)
            
            if response.status_code in [200, 201]:
                data = response.json()
                print_success("Credential submitted")
                print(f"  ID: {data.get('id')}")
                print(f"  Type: {data.get('credential_type')}")
                print(f"  Status: {data.get('verification_status')}")
            elif response.status_code == 409:
                print_warning("Duplicate credential (expected if re-running test)")
            else:
                print_error(f"Credential submit failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 6: Submit license credential
        print_test("POST /professionals/me/verification/credentials (license)")
        try:
            test_file_path = f"{user_id}/20260418_test_license.pdf"
            expiry_date = (date.today() + timedelta(days=365)).isoformat()
            
            response = await client.post(
                f"{BASE_URL}/professionals/me/verification/credentials",
                headers=headers,
                json={
                    "credential_type": "license",
                    "credential_subtype": "medical_council_license",
                    "credential_name": "Medical Council of India License",
                    "issuing_organization": "Medical Council of India",
                    "issued_date": "2020-01-15",
                    "expiry_date": expiry_date,
                    "license_number": "MCI-TEST-12345678",
                    "document_url": test_file_path
                }
            )
            print_response(response)
            
            if response.status_code in [200, 201]:
                data = response.json()
                print_success("License submitted")
                print(f"  License number: {data.get('license_number')}")
                print(f"  Expires: {data.get('expiry_date')}")
            elif response.status_code == 409:
                print_warning("Duplicate license (expected if re-running test)")
            else:
                print_error(f"License submit failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 7: Get all credentials
        print_test("GET /professionals/me/verification/credentials")
        try:
            response = await client.get(
                f"{BASE_URL}/professionals/me/verification/credentials",
                headers=headers
            )
            print_response(response)
            
            if response.status_code == 200:
                credentials = response.json()
                print_success(f"Retrieved {len(credentials)} credentials")
                for cred in credentials:
                    print(f"  - {cred.get('credential_name')} ({cred.get('verification_status')})")
            else:
                print_error(f"Credentials list failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")


async def test_admin_endpoints():
    """Test admin verification endpoints."""
    if not ADMIN_API_KEY:
        print_warning("Skipping admin tests - no ADMIN_API_KEY in .env")
        print("To test admin endpoints, add your admin API key to .env:")
        print("  ADMIN_API_KEY=your-admin-key")
        return

    headers = {"X-Admin-Key": ADMIN_API_KEY}
    
    async with httpx.AsyncClient() as client:
        
        # Test 1: Get verification queue (all)
        print_test("GET /admin/verification/queue")
        try:
            response = await client.get(
                f"{ADMIN_BASE_URL}/verification/queue",
                headers=headers
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success("Queue retrieved")
                print(f"  Total items: {data.get('total_count', 0)}")
                print(f"  Pending identity: {data.get('pending_identity_count', 0)}")
                print(f"  Pending credentials: {data.get('pending_credential_count', 0)}")
                
                if data.get('items'):
                    print(f"\n  First item:")
                    item = data['items'][0]
                    print(f"    Professional: {item.get('professional_username')}")
                    print(f"    Type: {item.get('verification_type')}")
                    print(f"    Status: {item.get('verification_status')}")
            else:
                print_error(f"Queue retrieval failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 2: Get identity verification queue
        print_test("GET /admin/verification/queue?queue_type=identity")
        try:
            response = await client.get(
                f"{ADMIN_BASE_URL}/verification/queue",
                headers=headers,
                params={"queue_type": "identity", "status_filter": "pending"}
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Identity queue: {len(data.get('items', []))} pending")
            else:
                print_error(f"Identity queue failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Test 3: Get credential verification queue
        print_test("GET /admin/verification/queue?queue_type=credential")
        try:
            response = await client.get(
                f"{ADMIN_BASE_URL}/verification/queue",
                headers=headers,
                params={"queue_type": "credential", "status_filter": "pending"}
            )
            print_response(response)
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Credential queue: {len(data.get('items', []))} pending")
            else:
                print_error(f"Credential queue failed: {response.status_code}")
        except Exception as e:
            print_error(f"Request failed: {e}")
        
        # Note: We won't test approve/reject endpoints automatically
        # as they modify data. Manual testing required.
        print_warning("\nNote: Approve/reject endpoints not tested automatically")
        print("To test approve/reject, use the admin dashboard or manually call:")
        print(f"  POST {ADMIN_BASE_URL}/verification/identity/{{user_id}}/approve")
        print(f"  POST {ADMIN_BASE_URL}/verification/identity/{{user_id}}/reject")
        print(f"  POST {ADMIN_BASE_URL}/verification/credential/{{id}}/approve")
        print(f"  POST {ADMIN_BASE_URL}/verification/credential/{{id}}/reject")


async def main():
    """Run all tests."""
    print(f"\n{BLUE}{'=' * 60}")
    print("Professional Verification System - Endpoint Tests")
    print(f"{'=' * 60}{RESET}\n")
    
    print(f"Testing against: {BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}\n")
    
    # Check prerequisites
    if not PROFESSIONAL_TOKEN and not ADMIN_API_KEY:
        print_error("No test credentials found in .env")
        print("\nTo run tests, add to backend/.env:")
        print("  TEST_PROFESSIONAL_TOKEN=<supabase-jwt-token>")
        print("  ADMIN_API_KEY=<admin-api-key>")
        print("\nYou can get a professional token from:")
        print("  1. Login to frontend as a professional")
        print("  2. Open browser DevTools > Application > Local Storage")
        print("  3. Find 'sb-<project>-auth-token' key")
        sys.exit(1)
    
    # Run professional tests
    print(f"\n{YELLOW}╔════════════════════════════════════════╗")
    print("║   PROFESSIONAL ENDPOINT TESTS          ║")
    print(f"╚════════════════════════════════════════╝{RESET}")
    await test_professional_endpoints()
    
    # Run admin tests
    print(f"\n{YELLOW}╔════════════════════════════════════════╗")
    print("║   ADMIN ENDPOINT TESTS                 ║")
    print(f"╚════════════════════════════════════════╝{RESET}")
    await test_admin_endpoints()
    
    print(f"\n{BLUE}{'=' * 60}")
    print("Tests Complete")
    print(f"{'=' * 60}{RESET}\n")


if __name__ == "__main__":
    asyncio.run(main())
