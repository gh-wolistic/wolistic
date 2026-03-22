import os
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone

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


class IntakeSession:
    def __init__(self, should_fail: bool = False) -> None:
        self.should_fail = should_fail
        self.added: list[object] = []
        self.rollback_called = False

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def commit(self) -> None:
        if self.should_fail:
            raise RuntimeError("db unavailable")

    async def refresh(self, obj: object) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(timezone.utc)

    async def rollback(self) -> None:
        self.rollback_called = True


def test_submit_expert_review_returns_created() -> None:
    session = IntakeSession()

    async def override_get_db_session() -> AsyncGenerator[IntakeSession, None]:
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/intake/expert-review",
            json={
                "query": "diet",
                "scope": "professionals",
                "answers": {
                    "goal": "Weight loss",
                    "challenge": "Sticking to routine",
                    "budget_range": "₹2,000–₹5,000",
                    "preferred_mode": "Online",
                },
                "source": "expert_review_chat",
                "metadata": {"source_page": "expert-review"},
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "received"
    assert "id" in payload
    assert "created_at" in payload

    created = session.added[0]
    assert created.query == "diet"
    assert created.scope == "professionals"
    assert created.source == "expert_review_chat"
    assert created.answers["goal"] == "Weight loss"


def test_submit_expert_review_handles_db_errors() -> None:
    session = IntakeSession(should_fail=True)

    async def override_get_db_session() -> AsyncGenerator[IntakeSession, None]:
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/intake/expert-review",
            json={
                "query": "diet",
                "scope": "professionals",
                "answers": {
                    "goal": "Weight loss",
                },
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to save expert review"
    assert session.rollback_called is True
