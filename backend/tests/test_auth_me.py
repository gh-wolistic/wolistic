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
from app.models.user import User

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class DummyAuthMeResult:
    def __init__(self, row: User | None) -> None:
        self._row = row

    def scalar_one_or_none(self) -> User | None:
        return self._row


class DummySession:
    def __init__(self) -> None:
        self.user = User(
            id=USER_ID,
            email="member@example.com",
            full_name="Morgan Lee",
            user_type="partner",
            user_subtype="diet_expert",
            user_status="verified",
        )

    async def execute(self, _query: object) -> DummyAuthMeResult:
        return DummyAuthMeResult(self.user)

    async def commit(self) -> None:
        return None

    async def refresh(self, _user: User) -> None:
        return None


async def override_get_db_session() -> AsyncGenerator[DummySession, None]:
    yield DummySession()


def override_get_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=USER_ID)


def test_auth_me_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_auth_me_returns_authenticated_profile() -> None:
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/auth/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "id": str(USER_ID),
        "email": "member@example.com",
        "name": "Morgan Lee",
        "user_type": "partner",
        "user_subtype": "diet_expert",
        "user_status": "verified",
        "user_role": "diet_expert",
        "onboarding_required": False,
    }


def test_auth_onboarding_updates_current_user() -> None:
    session = DummySession()

    async def override_get_db_session() -> AsyncGenerator[DummySession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.patch(
            "/api/v1/auth/onboarding",
            json={"user_type": "client", "user_subtype": "client"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert session.user.user_type == "client"
    assert session.user.user_subtype == "client"
    assert session.user.user_status == "verified"
    assert response.json()["onboarding_required"] is False


def test_auth_onboarding_rejects_invalid_selection() -> None:
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.patch(
            "/api/v1/auth/onboarding",
            json={"user_type": "client", "user_subtype": "diet_expert"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422