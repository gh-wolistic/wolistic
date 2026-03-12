import os
import uuid
from collections.abc import AsyncGenerator

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


class EmptyResult:
    def all(self) -> list[tuple[object, str]]:
        return []


class DummySession:
    async def execute(self, _query: object) -> EmptyResult:
        return EmptyResult()


async def override_get_db_session() -> AsyncGenerator[DummySession, None]:
    yield DummySession()


def override_get_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=uuid.UUID("00000000-0000-0000-0000-000000000001"))


def test_booking_history_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/booking/history/me")

    assert response.status_code == 401


def test_booking_history_uses_authenticated_user() -> None:
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/booking/history/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "latest_booking": None,
        "next_booking": None,
        "immediate_bookings": [],
        "upcoming_bookings": [],
        "past_bookings": [],
    }