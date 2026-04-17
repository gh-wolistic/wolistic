"""
Comprehensive test suite for Session Booking System (Stages 1-8)

Coverage:
- Schema validation (GroupClass, ClassSession, ClassEnrollment)
- Tier enforcement (Free/Pro/Elite/Celeb limits)
- Enrollment flow (capacity, duplicates, sold-out)
- Publish workflow (draft → published → locked)
- Attendance marking (attended, no_show, session_cancelled)
- Refund automation
- Waitlist registration
- Concurrent operations
- Edge cases and boundary conditions

Test Philosophy:
- Test all four tiers explicitly
- Challenge every happy-path assumption
- Verify API enforcement, not just UI gating
- Test rollback and failure paths
"""
import os
import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.main import app
from app.models.classes import GroupClass, ClassSession, ClassEnrollment, SessionInterest, WorkLocation
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan
from app.models.user import User

# Test user IDs
PROFESSIONAL_FREE_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
PROFESSIONAL_PRO_ID = uuid.UUID("10000000-0000-0000-0000-000000000002")
PROFESSIONAL_ELITE_ID = uuid.UUID("10000000-0000-0000-0000-000000000003")
PROFESSIONAL_CELEB_ID = uuid.UUID("10000000-0000-0000-0000-000000000004")
CLIENT_USER_ID = uuid.UUID("20000000-0000-0000-0000-000000000001")
CLIENT_USER_2_ID = uuid.UUID("20000000-0000-0000-0000-000000000002")


@pytest.fixture
async def db_session():
    """Async database session for tests."""
    async for session in get_db_session():
        yield session


@pytest.fixture
async def setup_tier_plans(db_session: AsyncSession):
    """Create tier plans with session/class limits."""
    plans = [
        SubscriptionPlan(
            tier_name="Free",
            max_classes=2,
            max_sessions_per_class=8,
            price_per_month=Decimal("0.00"),
        ),
        SubscriptionPlan(
            tier_name="Pro",
            max_classes=5,
            max_sessions_per_class=20,
            price_per_month=Decimal("999.00"),
        ),
        SubscriptionPlan(
            tier_name="Elite",
            max_classes=15,
            max_sessions_per_class=60,
            price_per_month=Decimal("2999.00"),
        ),
        SubscriptionPlan(
            tier_name="Celeb",
            max_classes=-1,  # Unlimited
            max_sessions_per_class=-1,
            price_per_month=Decimal("9999.00"),
        ),
    ]
    
    for plan in plans:
        db_session.add(plan)
    
    await db_session.commit()
    return plans


@pytest.fixture
async def setup_professionals(db_session: AsyncSession, setup_tier_plans):
    """Create professionals with different tiers."""
    professionals = {
        "free": User(
            id=PROFESSIONAL_FREE_ID,
            email="prof_free@test.com",
            username="prof_free",
            role="professional",
        ),
        "pro": User(
            id=PROFESSIONAL_PRO_ID,
            email="prof_pro@test.com",
            username="prof_pro",
            role="professional",
        ),
        "elite": User(
            id=PROFESSIONAL_ELITE_ID,
            email="prof_elite@test.com",
            username="prof_elite",
            role="professional",
        ),
        "celeb": User(
            id=PROFESSIONAL_CELEB_ID,
            email="prof_celeb@test.com",
            username="prof_celeb",
            role="professional",
        ),
    }
    
    for user in professionals.values():
        db_session.add(user)
    
    # Create subscriptions
    subscriptions = [
        ProfessionalSubscription(
            user_id=PROFESSIONAL_FREE_ID,
            tier_name="Free",
            status="active",
            start_date=datetime.now(timezone.utc),
        ),
        ProfessionalSubscription(
            user_id=PROFESSIONAL_PRO_ID,
            tier_name="Pro",
            status="active",
            start_date=datetime.now(timezone.utc),
        ),
        ProfessionalSubscription(
            user_id=PROFESSIONAL_ELITE_ID,
            tier_name="Elite",
            status="active",
            start_date=datetime.now(timezone.utc),
        ),
        ProfessionalSubscription(
            user_id=PROFESSIONAL_CELEB_ID,
            tier_name="Celeb",
            status="active",
            start_date=datetime.now(timezone.utc),
        ),
    ]
    
    for sub in subscriptions:
        db_session.add(sub)
    
    await db_session.commit()
    return professionals


@pytest.fixture
async def setup_clients(db_session: AsyncSession):
    """Create client users."""
    clients = [
        User(
            id=CLIENT_USER_ID,
            email="client1@test.com",
            username="client1",
            role="user",
        ),
        User(
            id=CLIENT_USER_2_ID,
            email="client2@test.com",
            username="client2",
            role="user",
        ),
    ]
    
    for client in clients:
        db_session.add(client)
    
    await db_session.commit()
    return clients


def mock_auth(user_id: uuid.UUID, role: str = "professional"):
    """Mock authentication for testing."""
    async def override_get_current_user():
        return AuthenticatedUser(
            user_id=user_id,
            email=f"user_{user_id}@test.com",
            role=role,
        )
    
    app.dependency_overrides[get_current_user] = override_get_current_user


def clear_auth():
    """Clear authentication mock."""
    app.dependency_overrides.clear()


# ══════════════════════════════════════════════════════════════════════════════
# TIER ENFORCEMENT TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestTierEnforcement:
    """Test subscription tier limits for classes and sessions."""
    
    @pytest.mark.asyncio
    async def test_free_tier_class_limit(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Free tier should be blocked at 2 classes."""
        mock_auth(PROFESSIONAL_FREE_ID)
        client = TestClient(app)
        
        # Create 2 classes (should succeed)
        for i in range(2):
            response = client.post(
                "/api/v1/partners/classes",
                json={
                    "title": f"Free Yoga {i+1}",
                    "category": "mind",
                    "duration_minutes": 60,
                    "capacity": 10,
                    "price": 299.00,
                },
            )
            assert response.status_code == 201, f"Failed to create class {i+1}"
        
        # Third class should fail
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Free Yoga 3",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 400, "Should block creation at Free tier limit"
        assert "limit" in response.json()["detail"].lower()
        assert "2" in response.json()["detail"]
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_pro_tier_class_limit(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Pro tier should be blocked at 5 classes."""
        mock_auth(PROFESSIONAL_PRO_ID)
        client = TestClient(app)
        
        # Create 5 classes (should succeed)
        for i in range(5):
            response = client.post(
                "/api/v1/partners/classes",
                json={
                    "title": f"Pro Yoga {i+1}",
                    "category": "body",
                    "duration_minutes": 60,
                    "capacity": 10,
                    "price": 499.00,
                },
            )
            assert response.status_code == 201
        
        # Sixth class should fail
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Pro Yoga 6",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 499.00,
            },
        )
        assert response.status_code == 400
        assert "5" in response.json()["detail"]
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_elite_tier_class_limit(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Elite tier should be blocked at 15 classes."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        # Create 15 classes
        for i in range(15):
            response = client.post(
                "/api/v1/partners/classes",
                json={
                    "title": f"Elite Yoga {i+1}",
                    "category": "nutrition",
                    "duration_minutes": 60,
                    "capacity": 15,
                    "price": 999.00,
                },
            )
            assert response.status_code == 201
        
        # 16th should fail
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Elite Yoga 16",
                "category": "nutrition",
                "duration_minutes": 60,
                "capacity": 15,
                "price": 999.00,
            },
        )
        assert response.status_code == 400
        assert "15" in response.json()["detail"]
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_celeb_tier_unlimited_classes(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Celeb tier should allow unlimited classes."""
        mock_auth(PROFESSIONAL_CELEB_ID)
        client = TestClient(app)
        
        # Create 20 classes (more than any paid tier)
        for i in range(20):
            response = client.post(
                "/api/v1/partners/classes",
                json={
                    "title": f"Celeb Yoga {i+1}",
                    "category": "lifestyle",
                    "duration_minutes": 90,
                    "capacity": 20,
                    "price": 1999.00,
                },
            )
            assert response.status_code == 201, f"Celeb tier should allow unlimited classes, failed at {i+1}"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_free_tier_session_limit(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Free tier should be blocked at 8 sessions per class."""
        mock_auth(PROFESSIONAL_FREE_ID)
        client = TestClient(app)
        
        # Create a class first
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Session Limit Test",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert class_response.status_code == 201
        class_id = class_response.json()["id"]
        
        # Create 8 sessions (should succeed)
        today = date.today()
        for i in range(8):
            session_date = today + timedelta(days=i+1)
            response = client.post(
                "/api/v1/partners/sessions",
                json={
                    "class_id": class_id,
                    "session_date": session_date.isoformat(),
                    "start_time": "09:00:00",
                },
            )
            assert response.status_code == 201
        
        # 9th session should fail
        response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (today + timedelta(days=9)).isoformat(),
                "start_time": "09:00:00",
            },
        )
        assert response.status_code == 400
        assert "8" in response.json()["detail"]
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# ENROLLMENT FLOW TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestEnrollmentFlow:
    """Test enrollment creation, capacity checks, and duplicate prevention."""
    
    @pytest.mark.asyncio
    async def test_enrollment_capacity_check(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """CRITICAL: Enrollment should fail when session is at capacity."""
        # Create session with capacity 2
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Small Capacity Class",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 2,
                "price": 500.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=1)).isoformat(),
                "start_time": "10:00:00",
            },
        )
        session_id = session_response.json()["id"]
        
        # Publish session
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Enroll 2 clients (should succeed)
        mock_auth(CLIENT_USER_ID, role="user")
        response1 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_test_1"},
        )
        assert response1.status_code == 201
        clear_auth()
        
        mock_auth(CLIENT_USER_2_ID, role="user")
        response2 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_test_2"},
        )
        assert response2.status_code == 201
        clear_auth()
        
        # Third enrollment should fail (capacity reached)
        third_client_id = uuid.uuid4()
        mock_auth(third_client_id, role="user")
        response3 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_test_3"},
        )
        assert response3.status_code == 400
        assert "sold out" in response3.json()["detail"].lower() or "capacity" in response3.json()["detail"].lower()
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_duplicate_enrollment_prevention(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """CRITICAL: User cannot enroll in same session twice."""
        # Setup
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Duplicate Test Class",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=2)).isoformat(),
                "start_time": "14:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # First enrollment (should succeed)
        mock_auth(CLIENT_USER_ID, role="user")
        response1 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_dup_1"},
        )
        assert response1.status_code == 201
        
        # Second enrollment by same user (should fail)
        response2 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_dup_2"},
        )
        assert response2.status_code == 409, "Should prevent duplicate enrollment"
        assert "already enrolled" in response2.json()["detail"].lower()
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_enrollment_in_draft_session_blocked(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """CRITICAL: Cannot enroll in draft (unpublished) session."""
        # Create draft session
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Draft Session Test",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 499.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=3)).isoformat(),
                "start_time": "11:00:00",
            },
        )
        session_id = session_response.json()["id"]
        # Do NOT publish - leave as draft
        clear_auth()
        
        # Try to enroll (should fail)
        mock_auth(CLIENT_USER_ID, role="user")
        response = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_draft"},
        )
        assert response.status_code in [400, 404], "Should block enrollment in draft session"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# PUBLISH WORKFLOW TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestPublishWorkflow:
    """Test session publish workflow and immutability."""
    
    @pytest.mark.asyncio
    async def test_session_publish_locks_editing(
        self, db_session: AsyncSession, setup_professionals
    ):
        """CRITICAL: Published sessions should be immutable (cannot edit)."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        # Create and publish session
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Immutability Test",
                "category": "nutrition",
                "duration_minutes": 45,
                "capacity": 8,
                "price": 399.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=5)).isoformat(),
                "start_time": "16:00:00",
            },
        )
        session_id = session_response.json()["id"]
        
        # Publish session
        publish_response = client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        assert publish_response.status_code == 200
        
        # Try to edit published session (should fail)
        edit_response = client.put(
            f"/api/v1/partners/sessions/{session_id}",
            json={"start_time": "17:00:00"},
        )
        assert edit_response.status_code == 400, "Should block editing of published session"
        assert "locked" in edit_response.json()["detail"].lower() or "published" in edit_response.json()["detail"].lower()
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_draft_session_can_be_edited(
        self, db_session: AsyncSession, setup_professionals
    ):
        """Draft sessions should allow editing."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Draft Edit Test",
                "category": "lifestyle",
                "duration_minutes": 60,
                "capacity": 12,
                "price": 599.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=7)).isoformat(),
                "start_time": "08:00:00",
            },
        )
        session_id = session_response.json()["id"]
        
        # Edit draft session (should succeed)
        edit_response = client.put(
            f"/api/v1/partners/sessions/{session_id}",
            json={"start_time": "09:00:00"},
        )
        assert edit_response.status_code == 200, "Should allow editing draft session"
        assert edit_response.json()["start_time"] == "09:00:00"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE & REFUND TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestAttendanceAndRefunds:
    """Test attendance marking and automatic refunds."""
    
    @pytest.mark.asyncio
    async def test_session_cancelled_triggers_refunds(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """CRITICAL: Marking enrollment as session_cancelled should trigger refund."""
        # Setup session with enrollment
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Refund Test Class",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 500.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() - timedelta(days=1)).isoformat(),  # Past session
                "start_time": "10:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Client enrolls
        mock_auth(CLIENT_USER_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_refund_test"},
        )
        clear_auth()
        
        # Get enrollment ID
        mock_auth(PROFESSIONAL_ELITE_ID)
        enrollments_response = client.get("/api/v1/partners/enrollments")
        enrollment_id = enrollments_response.json()["enrollments"][0]["id"]
        
        # Mark attendance as session_cancelled
        attendance_response = client.post(
            f"/api/v1/partners/sessions/{session_id}/mark-attendance",
            json={
                "attendance": [
                    {"enrollment_id": enrollment_id, "status": "session_cancelled"}
                ]
            },
        )
        assert attendance_response.status_code == 200
        
        # Verify refund was processed
        assert attendance_response.json()["refunds_processed"] == 1
        
        # Check enrollment payment_status updated to refunded
        enrollment_check = client.get(f"/api/v1/partners/enrollments")
        updated_enrollment = enrollment_check.json()["enrollments"][0]
        assert updated_enrollment["payment_status"] == "refunded", "Payment status should be 'refunded'"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_no_show_does_not_trigger_refund(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """No-show status should NOT trigger refund."""
        # Setup
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "No Show Test",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 400.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() - timedelta(days=1)).isoformat(),
                "start_time": "14:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Enroll
        mock_auth(CLIENT_USER_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_noshow"},
        )
        clear_auth()
        
        # Mark as no-show
        mock_auth(PROFESSIONAL_ELITE_ID)
        enrollments = client.get("/api/v1/partners/enrollments").json()["enrollments"]
        enrollment_id = enrollments[0]["id"]
        
        attendance_response = client.post(
            f"/api/v1/partners/sessions/{session_id}/mark-attendance",
            json={
                "attendance": [
                    {"enrollment_id": enrollment_id, "status": "no_show_client"}
                ]
            },
        )
        assert attendance_response.status_code == 200
        assert attendance_response.json()["refunds_processed"] == 0, "No-show should NOT trigger refund"
        
        # Verify payment status still 'paid'
        enrollment_check = client.get("/api/v1/partners/enrollments").json()["enrollments"][0]
        assert enrollment_check["payment_status"] == "paid"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# WAITLIST TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestWaitlist:
    """Test waitlist registration for sold-out sessions."""
    
    @pytest.mark.asyncio
    async def test_waitlist_registration_when_sold_out(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """Users can register interest when session is sold out."""
        # Create session with capacity 1
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Waitlist Test",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 1,
                "price": 300.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=10)).isoformat(),
                "start_time": "11:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Fill capacity
        mock_auth(CLIENT_USER_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_waitlist_1"},
        )
        clear_auth()
        
        # Second user tries to register interest
        mock_auth(CLIENT_USER_2_ID, role="user")
        interest_response = client.post(f"/api/v1/sessions/{session_id}/interest")
        assert interest_response.status_code == 201, "Should allow waitlist registration"
        assert interest_response.json()["interested"] is True
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_waitlist_blocked_when_capacity_available(
        self, db_session: AsyncSession, setup_professionals, setup_clients
    ):
        """Cannot register interest if session has available capacity."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Waitlist Block Test",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 500.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=12)).isoformat(),
                "start_time": "15:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Try to register interest when capacity available
        mock_auth(CLIENT_USER_ID, role="user")
        interest_response = client.post(f"/api/v1/sessions/{session_id}/interest")
        assert interest_response.status_code == 400, "Should block waitlist when capacity available"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMA VALIDATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestSchemaValidation:
    """Test schema validation for classes, sessions, and enrollments."""
    
    @pytest.mark.asyncio
    async def test_class_creation_required_fields(
        self, db_session: AsyncSession, setup_professionals
    ):
        """All required fields must be present."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        # Missing title
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 422, "Should reject missing title"
        
        # Missing category
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Test Class",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 422, "Should reject missing category"
        
        # Invalid category
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Test Class",
                "category": "invalid_category",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 422, "Should reject invalid category"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_class_validation_constraints(
        self, db_session: AsyncSession, setup_professionals
    ):
        """Test validation constraints (capacity > 0, price >= 0, etc)."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        # Zero capacity
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Zero Capacity",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 0,
                "price": 299.00,
            },
        )
        assert response.status_code == 422, "Should reject capacity = 0"
        
        # Negative price
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Negative Price",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 10,
                "price": -100.00,
            },
        )
        assert response.status_code == 422, "Should reject negative price"
        
        # Zero duration
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Zero Duration",
                "category": "body",
                "duration_minutes": 0,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 422, "Should reject zero duration"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_session_date_validation(
        self, db_session: AsyncSession, setup_professionals
    ):
        """Sessions in the past should be rejected (for creation)."""
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Date Validation Test",
                "category": "nutrition",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 399.00,
            },
        )
        class_id = class_response.json()["id"]
        
        # Try to create session in the past
        past_date = date.today() - timedelta(days=5)
        response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": past_date.isoformat(),
                "start_time": "10:00:00",
            },
        )
        assert response.status_code == 400, "Should reject session in the past"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# CONCURRENT OPERATIONS TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestConcurrentOperations:
    """Test race conditions and concurrent operations."""
    
    @pytest.mark.asyncio
    async def test_concurrent_enrollment_at_capacity(
        self, db_session: AsyncSession, setup_professionals
    ):
        """
        CRITICAL: Test race condition when multiple users enroll simultaneously
        at capacity boundary.
        
        NOTE: This test requires actual concurrent requests to properly test.
        FastAPI TestClient is synchronous, so this is a simplified version.
        In production, use async test client or load testing tools.
        """
        mock_auth(PROFESSIONAL_ELITE_ID)
        client = TestClient(app)
        
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Concurrent Test",
                "category": "lifestyle",
                "duration_minutes": 60,
                "capacity": 1,  # Only 1 spot
                "price": 500.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=15)).isoformat(),
                "start_time": "12:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # First enrollment succeeds
        mock_auth(CLIENT_USER_ID, role="user")
        response1 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_concurrent_1"},
        )
        assert response1.status_code == 201
        clear_auth()
        
        # Second should fail (capacity reached)
        mock_auth(CLIENT_USER_2_ID, role="user")
        response2 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_concurrent_2"},
        )
        assert response2.status_code == 400, "Should prevent over-enrollment"
        
        clear_auth()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
