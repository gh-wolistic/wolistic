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
    def __init__(self, row: tuple[User, uuid.UUID | None] | None) -> None:
        self._row = row

    def one_or_none(self) -> tuple[User, uuid.UUID | None] | None:
        return self._row


class DummySession:
    async def execute(self, _query: object) -> DummyAuthMeResult:
        user = User(
            id=USER_ID,
            email="member@example.com",
            full_name="Morgan Lee",
        )
        return DummyAuthMeResult((user, USER_ID))


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
        "user_type": "professional",
        "user_role": "professional",
    }