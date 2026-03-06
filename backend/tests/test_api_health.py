import os
from collections.abc import AsyncGenerator

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


class DummySession:
    async def execute(self, _query: object) -> None:
        return None


async def override_get_db_session() -> AsyncGenerator[DummySession, None]:
    yield DummySession()


def test_root_returns_running_status() -> None:
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"service": "backend", "status": "running"}


def test_healthz_returns_ok_without_db() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readyz_returns_ok_with_db_override() -> None:
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/readyz")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
