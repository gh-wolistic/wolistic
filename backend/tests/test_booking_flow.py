import os
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings
from app.models.booking import Booking, BookingPayment

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
PROFESSIONAL_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


class ScalarListResult:
    def __init__(self, items: list[object]) -> None:
        self._items = items

    def scalars(self) -> "ScalarListResult":
        return self

    def all(self) -> list[object]:
        return self._items


class ScalarResult:
    def __init__(self, value: object) -> None:
        self._value = value

    def one_or_none(self) -> object:
        return self._value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalar_one(self) -> object:
        return self._value


class SequenceSession:
    def __init__(self, results: list[object]) -> None:
        self._results = results

    async def execute(self, _query: object) -> object:
        return self._results.pop(0)


class PaymentOrderSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    async def execute(self, _query: object) -> ScalarResult:
        return ScalarResult((PROFESSIONAL_ID, "dr-sarah-chen"))

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        for item in self.added:
            if isinstance(item, Booking) and getattr(item, "id", None) is None:
                item.id = 101

    async def commit(self) -> None:
        return None


def override_get_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=USER_ID)


def test_create_payment_order_generates_booking_reference() -> None:
    session = PaymentOrderSession()

    async def override_get_db_session() -> AsyncGenerator[PaymentOrderSession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/booking/payments/order",
            json={
                "amount": 1499,
                "currency": "INR",
                "professional_username": "dr-sarah-chen",
                "service_name": "Initial Consultation",
                "booking_at": "2026-03-20T10:30:00Z",
                "is_immediate": False,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["booking_reference"].startswith("bk_")

    booking = next(item for item in session.added if isinstance(item, Booking))
    payment = next(item for item in session.added if isinstance(item, BookingPayment))

    assert booking.booking_reference == payload["booking_reference"]
    assert booking.client_user_id == USER_ID
    assert payment.amount == Decimal("1499")


def test_booking_history_surfaces_immediate_bookings() -> None:
    created_at = datetime(2026, 3, 13, 10, 0, tzinfo=timezone.utc)
    immediate_booking = Booking(
        id=7,
        booking_reference="bk_immediate_001",
        professional_id=PROFESSIONAL_ID,
        client_user_id=USER_ID,
        service_name="Immediate Consultation",
        status="confirmed",
        scheduled_for=None,
        is_immediate=True,
        created_at=created_at,
    )
    payment = BookingPayment(
        id=11,
        booking_id=7,
        provider="razorpay",
        provider_order_id="order_mock_1",
        amount=Decimal("999.00"),
        currency="INR",
        status="success",
        created_at=created_at,
        updated_at=created_at,
    )

    session = SequenceSession(
        [
            ScalarListResult([(immediate_booking, "dr-sarah-chen")]),
            ScalarListResult([payment]),
        ]
    )

    async def override_get_db_session() -> AsyncGenerator[SequenceSession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)

    try:
        response = client.get("/api/v1/booking/history/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["latest_booking"]["booking_reference"] == "bk_immediate_001"
    assert payload["next_booking"] is None
    assert payload["immediate_bookings"] == [
        {
            "booking_reference": "bk_immediate_001",
            "professional_username": "dr-sarah-chen",
            "service_name": "Immediate Consultation",
            "status": "confirmed",
            "scheduled_for": None,
            "is_immediate": True,
            "created_at": "2026-03-13T10:00:00Z",
            "payment_status": "success",
        }
    ]
    assert payload["upcoming_bookings"] == []
    assert payload["past_bookings"] == []