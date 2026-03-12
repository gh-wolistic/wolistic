from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import Settings
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentOrderResult,
    PaymentWebhookEvent,
    PaymentProvider,
    PaymentVerificationRequest,
    PaymentVerificationResult,
)


class MockPaymentProvider(PaymentProvider):
    provider_name = "razorpay"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def create_order(self, request: PaymentOrderRequest) -> PaymentOrderResult:
        order_id = f"order_mock_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        return PaymentOrderResult(
            provider=self.provider_name,
            mode="mock",
            key_id="rzp_test_mock",
            order_id=order_id,
            amount_subunits=int(round(request.amount * 100)),
            currency=request.currency,
            provider_payload={
                "id": order_id,
                "amount": int(round(request.amount * 100)),
                "currency": request.currency,
                "receipt": request.booking_reference,
            },
        )

    def verify_payment(self, request: PaymentVerificationRequest) -> PaymentVerificationResult:
        return PaymentVerificationResult(
            status=self._settings.PAYMENT_MOCK_DEFAULT_STATUS,
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
