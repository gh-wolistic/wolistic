import os
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from fastapi.testclient import TestClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000021")


class ScalarResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalar_one(self) -> object:
        return self._value

    def one(self) -> object:
        return self._value


class ScalarListResult:
    def __init__(self, items: list[object]) -> None:
        self._items = items

    def scalars(self) -> "ScalarListResult":
        return self

    def all(self) -> list[object]:
        return self._items


class SequenceSession:
    def __init__(self, results: list[object]) -> None:
        self._results = results

    async def execute(self, _query: object) -> object:
        return self._results.pop(0)


def override_get_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=USER_ID)


def test_partner_dashboard_rejects_non_partner_user() -> None:
    session = SequenceSession(
        [
            ScalarResult(
                SimpleNamespace(
                    id=USER_ID,
                    user_type="client",
                )
            )
        ]
    )

    async def override_get_db_session() -> AsyncGenerator[SequenceSession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/partners/me/dashboard")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403


def test_partner_dashboard_returns_aggregate_payload() -> None:
    professional = SimpleNamespace(
        membership_tier="premium",
        specialization="Mind Wellness",
        location="Mumbai",
        languages=["English", "Hindi"],
        certifications=["A", "B"],
        services=[
            SimpleNamespace(is_active=True),
            SimpleNamespace(is_active=False),
        ],
        availability_slots=[SimpleNamespace(), SimpleNamespace()],
        rating_avg=Decimal("4.7"),
        rating_count=12,
    )

    review = SimpleNamespace(
        id=1,
        reviewer=SimpleNamespace(full_name="Taylor"),
        rating=5,
        review_text="Great session",
        created_at=datetime(2026, 4, 1, 10, 0, tzinfo=timezone.utc),
    )

    session = SequenceSession(
        [
            ScalarResult(SimpleNamespace(id=USER_ID, user_type="partner")),
            ScalarResult(professional),
            ScalarResult(3),
            ScalarResult((7, 2, 1, 4)),
            ScalarResult((Decimal("2499.00"), "INR")),
            ScalarResult(2),
            ScalarListResult([review]),
        ]
    )

    async def override_get_db_session() -> AsyncGenerator[SequenceSession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/partners/me/dashboard")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["overview"]["membership_tier"] == "premium"
    assert payload["metrics"]["services_total"] == 2
    assert payload["metrics"]["active_services_total"] == 1
    assert payload["metrics"]["bookings_total"] == 7
    assert payload["metrics"]["revenue_total"] == 2499.0
    assert payload["metrics"]["holistic_teams_total"] == 2
    assert payload["recent_reviews"][0]["reviewer_name"] == "Taylor"
