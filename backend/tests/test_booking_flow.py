import os
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from decimal import Decimal
import json

from fastapi.testclient import TestClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ["PAYMENT_PROVIDER"] = "razorpay"
os.environ["RAZORPAY_KEY_ID"] = "rzp_test_example"
os.environ["RAZORPAY_KEY_SECRET"] = "secret_123"
os.environ["RAZORPAY_WEBHOOK_SECRET"] = "webhook_secret_123"

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings
from app.models.booking import Booking, BookingPayment
from app.services.payments import service as payment_service
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentOrderResult,
    PaymentVerificationRequest,
    PaymentVerificationResult,
    PaymentWebhookEvent,
)
from app.services.payments.providers.razorpay import RazorpayPaymentProvider

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
PROFESSIONAL_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


class DeterministicTestProvider:
    def create_order(self, request: PaymentOrderRequest) -> PaymentOrderResult:
        return PaymentOrderResult(
            provider="razorpay",
            mode="live",
            key_id="rzp_test_example",
            order_id="order_test_1",
            amount_subunits=int(round(request.amount * 100)),
            currency=request.currency,
            provider_payload={"id": "order_test_1"},
        )

    def verify_payment(self, request: PaymentVerificationRequest) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            status="success",
            provider_payment_id=request.payment_id,
            provider_signature=request.signature,
            provider_payload={
                "razorpay_order_id": request.order_id,
                "razorpay_payment_id": request.payment_id,
                "razorpay_signature": request.signature,
            },
        )

    def parse_webhook(self, payload: bytes, signature: str) -> PaymentWebhookEvent | None:
        return None


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
        self._execute_call_count = 0

    async def execute(self, _query: object) -> ScalarResult:
        self._execute_call_count += 1
        if self._execute_call_count == 1:
            # Professional lookup by username.
            return ScalarResult(PROFESSIONAL_ID)
        if self._execute_call_count == 2:
            # Service pricing lookup tuple: price, offers, offer_type, offer_value.
            return ScalarResult((Decimal("1499"), None, None, None))
        if self._execute_call_count == 4:
            # Payment service does its own professional lookup returning id + username.
            return ScalarResult((PROFESSIONAL_ID, "dr-sarah-chen"))
        # Promotional eligibility lookup returns no prior claimed row.
        return ScalarResult(None)

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def flush(self) -> None:
        for item in self.added:
            if isinstance(item, Booking) and getattr(item, "id", None) is None:
                item.id = 101

    async def commit(self) -> None:
        return None


class PaymentVerifySession:
    def __init__(self, booking: Booking, payment: BookingPayment) -> None:
        self._booking = booking
        self._payment = payment
        self.commit_count = 0

    async def execute(self, _query: object) -> ScalarResult:
        if self._booking is not None:
            booking = self._booking
            self._booking = None
            return ScalarResult(booking)

        if self._payment is not None:
            payment = self._payment
            self._payment = None
            return ScalarResult(payment)

        return ScalarResult(None)

    async def commit(self) -> None:
        self.commit_count += 1


class PaymentWebhookSession:
    def __init__(self, payment: BookingPayment) -> None:
        self._payment = payment
        self.commit_count = 0

    async def execute(self, _query: object) -> ScalarResult:
        return ScalarResult(self._payment)

    async def commit(self) -> None:
        self.commit_count += 1


def override_get_current_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=USER_ID)


def test_create_payment_order_generates_booking_reference() -> None:
    session = PaymentOrderSession()

    async def override_get_db_session() -> AsyncGenerator[PaymentOrderSession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    original_get_payment_provider = payment_service.get_payment_provider
    payment_service.get_payment_provider = lambda _settings: DeterministicTestProvider()
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
        payment_service.get_payment_provider = original_get_payment_provider

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


def test_verify_payment_uses_backend_owned_resolution() -> None:
    created_at = datetime(2026, 3, 13, 10, 0, tzinfo=timezone.utc)
    booking = Booking(
        id=7,
        booking_reference="bk_verify_001",
        professional_id=PROFESSIONAL_ID,
        client_user_id=USER_ID,
        service_name="Initial Consultation",
        status="pending",
        scheduled_for=None,
        is_immediate=False,
        created_at=created_at,
    )
    payment = BookingPayment(
        id=11,
        booking_id=7,
        provider="razorpay",
        provider_order_id="order_mock_1",
        amount=Decimal("999.00"),
        currency="INR",
        status="created",
        created_at=created_at,
        updated_at=created_at,
    )
    session = PaymentVerifySession(booking=booking, payment=payment)

    async def override_get_db_session() -> AsyncGenerator[PaymentVerifySession, None]:
        yield session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db_session] = override_get_db_session
    original_get_payment_provider = payment_service.get_payment_provider
    payment_service.get_payment_provider = lambda _settings: DeterministicTestProvider()
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/booking/payments/verify",
            json={
                "razorpay_order_id": "order_mock_1",
                "razorpay_payment_id": "pay_demo_1",
                "razorpay_signature": "signature_demo_1",
                "booking_reference": "bk_verify_001",
                "next_route": "/authorized",
                "professional_username": "dr-sarah-chen",
                "service_name": "Initial Consultation",
                "is_immediate": False,
            },
        )
    finally:
        app.dependency_overrides.clear()
        payment_service.get_payment_provider = original_get_payment_provider

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert booking.status == "confirmed"
    assert payment.status == "success"
    assert payment.provider_payment_id == "pay_demo_1"
    assert payment.provider_signature == "signature_demo_1"
    assert payment.verified_at is not None
    assert session.commit_count == 1


def test_razorpay_provider_verifies_hmac_signature() -> None:
    settings = get_settings().model_copy(
        update={
            "PAYMENT_PROVIDER": "razorpay",
            "RAZORPAY_KEY_ID": "rzp_test_example",
            "RAZORPAY_KEY_SECRET": "secret_123",
        }
    )
    provider = RazorpayPaymentProvider(settings)
    order_id = "order_test_123"
    payment_id = "pay_test_456"
    import hashlib
    import hmac

    signature = hmac.new(
        b"secret_123",
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    result = provider.verify_payment(
        PaymentVerificationRequest(order_id=order_id, payment_id=payment_id, signature=signature)
    )

    assert result.status == "success"
    assert result.provider_payment_id == payment_id


def test_webhook_updates_payment_and_booking() -> None:
    settings = get_settings().model_copy(
        update={
            "PAYMENT_PROVIDER": "razorpay",
            "RAZORPAY_KEY_ID": "rzp_test_example",
            "RAZORPAY_KEY_SECRET": "secret_123",
            "RAZORPAY_WEBHOOK_SECRET": "webhook_secret_123",
        }
    )
    created_at = datetime(2026, 3, 13, 10, 0, tzinfo=timezone.utc)
    booking = Booking(
        id=17,
        booking_reference="bk_webhook_001",
        professional_id=PROFESSIONAL_ID,
        client_user_id=USER_ID,
        service_name="Follow-up Session",
        status="pending",
        scheduled_for=None,
        is_immediate=False,
        created_at=created_at,
    )
    payment = BookingPayment(
        id=21,
        booking_id=17,
        booking=booking,
        provider="razorpay",
        provider_order_id="order_test_123",
        amount=Decimal("999.00"),
        currency="INR",
        status="created",
        created_at=created_at,
        updated_at=created_at,
    )
    session = PaymentWebhookSession(payment)
    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_123",
                    "order_id": "order_test_123",
                }
            }
        },
    }
    body = json.dumps(payload).encode("utf-8")
    import hashlib
    import hmac

    signature = hmac.new(b"webhook_secret_123", body, hashlib.sha256).hexdigest()

    async def override_get_db_session() -> AsyncGenerator[PaymentWebhookSession, None]:
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    from app.api.routes import booking as booking_routes
    from app.services.payments import service as payment_service

    original_get_settings = booking_routes.get_settings
    original_get_payment_provider = payment_service.get_payment_provider
    booking_routes.get_settings = lambda: settings
    payment_service.get_payment_provider = lambda _settings: RazorpayPaymentProvider(settings)
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/booking/payments/webhooks/razorpay",
            content=body,
            headers={"X-Razorpay-Signature": signature, "Content-Type": "application/json"},
        )
    finally:
        app.dependency_overrides.clear()
        booking_routes.get_settings = original_get_settings
        payment_service.get_payment_provider = original_get_payment_provider

    assert response.status_code == 202
    payload = response.json()
    assert payload["processed"] is True
    assert payment.status == "success"
    assert payment.provider_payment_id == "pay_test_123"
    assert payment.verified_at is not None
    assert booking.status == "confirmed"
    assert session.commit_count == 1