"""
Integration tests for Session Booking System (End-to-End flows)

Coverage:
- Complete enrollment flow: create class → create session → publish → enroll → mark attendance
- Refund automation flow: enroll → cancel session → verify refund
- Tier upgrade flow: create at limit → upgrade tier → create more
- Concurrent enrollment at capacity boundary
- Professional workflow: draft → edit → publish → manage enrollments

These tests verify that all components work together correctly across the stack.
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
from app.models.classes import GroupClass, ClassSession, ClassEnrollment
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan
from app.models.user import User

# Test IDs
PROFESSIONAL_ID = uuid.UUID("30000000-0000-0000-0000-000000000001")
CLIENT_1_ID = uuid.UUID("40000000-0000-0000-0000-000000000001")
CLIENT_2_ID = uuid.UUID("40000000-0000-0000-0000-000000000002")
CLIENT_3_ID = uuid.UUID("40000000-0000-0000-0000-000000000003")


@pytest.fixture
async def db_session():
    """Async database session."""
    async for session in get_db_session():
        yield session


@pytest.fixture
async def setup_tier_plans(db_session: AsyncSession):
    """Create tier plans."""
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
    ]
    
    for plan in plans:
        db_session.add(plan)
    
    await db_session.commit()
    return plans


@pytest.fixture
async def setup_users(db_session: AsyncSession):
    """Create test users."""
    users = [
        User(
            id=PROFESSIONAL_ID,
            email="prof@test.com",
            username="testprof",
            role="professional",
        ),
        User(
            id=CLIENT_1_ID,
            email="client1@test.com",
            username="client1",
            role="user",
        ),
        User(
            id=CLIENT_2_ID,
            email="client2@test.com",
            username="client2",
            role="user",
        ),
        User(
            id=CLIENT_3_ID,
            email="client3@test.com",
            username="client3",
            role="user",
        ),
    ]
    
    for user in users:
        db_session.add(user)
    
    # Professional subscription
    subscription = ProfessionalSubscription(
        user_id=PROFESSIONAL_ID,
        tier_name="Elite",
        status="active",
        start_date=datetime.now(timezone.utc),
    )
    db_session.add(subscription)
    
    await db_session.commit()
    return users


def mock_auth(user_id: uuid.UUID, role: str = "professional"):
    """Mock authentication."""
    async def override():
        return AuthenticatedUser(
            user_id=user_id,
            email=f"user_{user_id}@test.com",
            role=role,
        )
    app.dependency_overrides[get_current_user] = override


def clear_auth():
    """Clear auth mock."""
    app.dependency_overrides.clear()


# ══════════════════════════════════════════════════════════════════════════════
# END-TO-END ENROLLMENT FLOW
# ══════════════════════════════════════════════════════════════════════════════

class TestCompleteEnrollmentFlow:
    """Test complete user journey from session creation to attendance marking."""
    
    @pytest.mark.asyncio
    async def test_happy_path_enrollment_and_attendance(
        self, db_session: AsyncSession, setup_tier_plans, setup_users
    ):
        """
        CRITICAL E2E TEST: Complete happy path flow
        
        Steps:
        1. Professional creates class
        2. Professional creates session
        3. Professional publishes session
        4. Client enrolls in session
        5. Professional marks client as attended
        6. Verify enrollment status updated
        """
        client = TestClient(app)
        
        # Step 1: Create class
        mock_auth(PROFESSIONAL_ID)
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "E2E Test Class",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 500.00,
            },
        )
        assert class_response.status_code == 201
        class_id = class_response.json()["id"]
        
        # Step 2: Create session
        session_date = (date.today() + timedelta(days=1)).isoformat()
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": session_date,
                "start_time": "10:00:00",
            },
        )
        assert session_response.status_code == 201
        session_id = session_response.json()["id"]
        assert session_response.json()["status"] == "draft"
        
        # Step 3: Publish session
        publish_response = client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        assert publish_response.status_code == 200
        assert publish_response.json()["status"] == "published"
        clear_auth()
        
        # Step 4: Client enrolls
        mock_auth(CLIENT_1_ID, role="user")
        enroll_response = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_e2e_1"},
        )
        assert enroll_response.status_code == 201
        enrollment_id = enroll_response.json()["id"]
        assert enroll_response.json()["status"] == "confirmed"
        assert enroll_response.json()["payment"]["status"] == "paid"
        clear_auth()
        
        # Step 5: Mark attendance (after session date passes)
        mock_auth(PROFESSIONAL_ID)
        attendance_response = client.post(
            f"/api/v1/partners/sessions/{session_id}/mark-attendance",
            json={
                "attendance": [
                    {"enrollment_id": enrollment_id, "status": "attended"}
                ]
            },
        )
        assert attendance_response.status_code == 200
        
        # Step 6: Verify enrollment updated
        enrollments = client.get("/api/v1/partners/enrollments").json()["enrollments"]
        updated_enrollment = next(e for e in enrollments if e["id"] == enrollment_id)
        assert updated_enrollment["status"] == "attended"
        assert updated_enrollment["payment_status"] == "paid"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_capacity_boundary_enforcement(
        self, db_session: AsyncSession, setup_tier_plans, setup_users
    ):
        """
        CRITICAL: Test capacity enforcement with multiple enrollments.
        
        Create session with capacity 2, enroll 2 clients, verify 3rd is rejected.
        """
        client = TestClient(app)
        
        # Create session with capacity 2
        mock_auth(PROFESSIONAL_ID)
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Capacity Test",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 2,
                "price": 400.00,
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
        
        # Enroll client 1 (should succeed)
        mock_auth(CLIENT_1_ID, role="user")
        response1 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_cap_1"},
        )
        assert response1.status_code == 201
        clear_auth()
        
        # Enroll client 2 (should succeed)
        mock_auth(CLIENT_2_ID, role="user")
        response2 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_cap_2"},
        )
        assert response2.status_code == 201
        clear_auth()
        
        # Verify capacity reached
        mock_auth(PROFESSIONAL_ID)
        session_details = client.get(f"/api/v1/partners/sessions/{session_id}").json()
        assert session_details["enrolled_count"] == 2
        assert session_details["capacity"] == 2
        clear_auth()
        
        # Enroll client 3 (should fail - sold out)
        mock_auth(CLIENT_3_ID, role="user")
        response3 = client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_cap_3"},
        )
        assert response3.status_code == 400
        assert "sold out" in response3.json()["detail"].lower() or "capacity" in response3.json()["detail"].lower()
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# REFUND AUTOMATION FLOW
# ══════════════════════════════════════════════════════════════════════════════

class TestRefundAutomationFlow:
    """Test automatic refund processing when session is cancelled."""
    
    @pytest.mark.asyncio
    async def test_session_cancellation_triggers_refunds(
        self, db_session: AsyncSession, setup_tier_plans, setup_users
    ):
        """
        CRITICAL: Verify refund automation works end-to-end.
        
        Steps:
        1. Create and publish session
        2. Multiple clients enroll
        3. Mark session as cancelled for all enrollments
        4. Verify all refunds processed
        5. Verify payment_status updated to 'refunded'
        """
        client = TestClient(app)
        
        # Setup: Create session
        mock_auth(PROFESSIONAL_ID)
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Refund Test Class",
                "category": "nutrition",
                "duration_minutes": 90,
                "capacity": 10,
                "price": 700.00,
            },
        )
        class_id = class_response.json()["id"]
        
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() - timedelta(days=1)).isoformat(),  # Past session
                "start_time": "16:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Enroll 2 clients
        mock_auth(CLIENT_1_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_refund_1"},
        )
        clear_auth()
        
        mock_auth(CLIENT_2_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_refund_2"},
        )
        clear_auth()
        
        # Get enrollment IDs
        mock_auth(PROFESSIONAL_ID)
        enrollments = client.get("/api/v1/partners/enrollments").json()["enrollments"]
        enrollment_ids = [e["id"] for e in enrollments if e["session_id"] == session_id]
        assert len(enrollment_ids) == 2
        
        # Mark session as cancelled for all
        attendance_response = client.post(
            f"/api/v1/partners/sessions/{session_id}/mark-attendance",
            json={
                "attendance": [
                    {"enrollment_id": enrollment_ids[0], "status": "session_cancelled"},
                    {"enrollment_id": enrollment_ids[1], "status": "session_cancelled"},
                ]
            },
        )
        assert attendance_response.status_code == 200
        assert attendance_response.json()["refunds_processed"] == 2
        
        # Verify refunds processed
        updated_enrollments = client.get("/api/v1/partners/enrollments").json()["enrollments"]
        for enrollment in updated_enrollments:
            if enrollment["id"] in enrollment_ids:
                assert enrollment["status"] == "session_cancelled"
                assert enrollment["payment_status"] == "refunded"
        
        clear_auth()
    
    @pytest.mark.asyncio
    async def test_no_show_does_not_refund(
        self, db_session: AsyncSession, setup_tier_plans, setup_users
    ):
        """
        CRITICAL: Verify no-show clients are NOT refunded.
        """
        client = TestClient(app)
        
        # Setup
        mock_auth(PROFESSIONAL_ID)
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "No Show Test",
                "category": "lifestyle",
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
                "session_date": (date.today() - timedelta(days=1)).isoformat(),
                "start_time": "09:00:00",
            },
        )
        session_id = session_response.json()["id"]
        client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        clear_auth()
        
        # Enroll client
        mock_auth(CLIENT_1_ID, role="user")
        client.post(
            f"/api/v1/sessions/{session_id}/enroll",
            json={"payment_order_id": "order_noshow_1"},
        )
        clear_auth()
        
        # Mark as no-show
        mock_auth(PROFESSIONAL_ID)
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
        
        # Verify payment still 'paid'
        updated = client.get("/api/v1/partners/enrollments").json()["enrollments"][0]
        assert updated["payment_status"] == "paid"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# TIER UPGRADE FLOW
# ══════════════════════════════════════════════════════════════════════════════

class TestTierUpgradeFlow:
    """Test tier limit enforcement and upgrade flow."""
    
    @pytest.mark.asyncio
    async def test_tier_upgrade_unlocks_limits(
        self, db_session: AsyncSession, setup_tier_plans
    ):
        """
        CRITICAL: Verify tier upgrade allows creating more classes.
        
        Steps:
        1. Create Free tier professional
        2. Create 2 classes (Free limit)
        3. Verify 3rd class blocked
        4. Upgrade to Pro tier
        5. Verify can now create 3rd class
        """
        client = TestClient(app)
        upgrade_prof_id = uuid.uuid4()
        
        # Create Free tier professional
        async for session in get_db_session():
            user = User(
                id=upgrade_prof_id,
                email="upgrade@test.com",
                username="upgradeprof",
                role="professional",
            )
            session.add(user)
            
            subscription = ProfessionalSubscription(
                user_id=upgrade_prof_id,
                tier_name="Free",
                status="active",
                start_date=datetime.now(timezone.utc),
            )
            session.add(subscription)
            await session.commit()
            break
        
        # Create 2 classes (Free limit)
        mock_auth(upgrade_prof_id)
        for i in range(2):
            response = client.post(
                "/api/v1/partners/classes",
                json={
                    "title": f"Free Class {i+1}",
                    "category": "mind",
                    "duration_minutes": 60,
                    "capacity": 10,
                    "price": 299.00,
                },
            )
            assert response.status_code == 201
        
        # 3rd class should fail
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Free Class 3",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 299.00,
            },
        )
        assert response.status_code == 400
        clear_auth()
        
        # Upgrade to Pro
        async for session in get_db_session():
            subscription = await session.execute(
                select(Subscription).where(Subscription.user_id == upgrade_prof_id)
            )
            sub = subscription.scalar_one()
            sub.tier_name = "Pro"
            await session.commit()
            break
        
        # Now 3rd class should succeed
        mock_auth(upgrade_prof_id)
        response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Pro Class 1",
                "category": "body",
                "duration_minutes": 60,
                "capacity": 15,
                "price": 499.00,
            },
        )
        assert response.status_code == 201, "Should allow creation after tier upgrade"
        
        clear_auth()


# ══════════════════════════════════════════════════════════════════════════════
# PUBLISH WORKFLOW IMMUTABILITY
# ══════════════════════════════════════════════════════════════════════════════

class TestPublishWorkflowImmutability:
    """Test draft → published workflow and immutability."""
    
    @pytest.mark.asyncio
    async def test_draft_to_published_workflow(
        self, db_session: AsyncSession, setup_tier_plans, setup_users
    ):
        """
        Test complete draft → edit → publish → locked workflow.
        """
        client = TestClient(app)
        mock_auth(PROFESSIONAL_ID)
        
        # Create class
        class_response = client.post(
            "/api/v1/partners/classes",
            json={
                "title": "Workflow Test",
                "category": "mind",
                "duration_minutes": 60,
                "capacity": 10,
                "price": 500.00,
            },
        )
        class_id = class_response.json()["id"]
        
        # Create session (draft by default)
        session_response = client.post(
            "/api/v1/partners/sessions",
            json={
                "class_id": class_id,
                "session_date": (date.today() + timedelta(days=5)).isoformat(),
                "start_time": "10:00:00",
            },
        )
        session_id = session_response.json()["id"]
        assert session_response.json()["status"] == "draft"
        
        # Edit draft session (should succeed)
        edit_response = client.put(
            f"/api/v1/partners/sessions/{session_id}",
            json={"start_time": "11:00:00"},
        )
        assert edit_response.status_code == 200
        assert edit_response.json()["start_time"] == "11:00:00"
        
        # Publish session
        publish_response = client.post(f"/api/v1/partners/sessions/{session_id}/publish")
        assert publish_response.status_code == 200
        assert publish_response.json()["status"] == "published"
        
        # Try to edit published session (should fail)
        edit_published = client.put(
            f"/api/v1/partners/sessions/{session_id}",
            json={"start_time": "12:00:00"},
        )
        assert edit_published.status_code == 400
        assert "locked" in edit_published.json()["detail"].lower() or "published" in edit_published.json()["detail"].lower()
        
        clear_auth()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
