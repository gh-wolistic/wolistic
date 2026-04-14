from __future__ import annotations

import base64
import hashlib
import hmac
import json
from decimal import Decimal, ROUND_HALF_UP
from urllib import error, request

from fastapi import HTTPException

from app.core.config import Settings
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentOrderResult,
    PaymentProvider,
    PaymentVerificationRequest,
    PaymentVerificationResult,
    PaymentWebhookEvent,
)


class RazorpayPaymentProvider(PaymentProvider):
    provider_name = "razorpay"
    _orders_endpoint = "https://api.razorpay.com/v1/orders"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _get_api_credentials(self) -> tuple[str, str]:
        key_id = self._settings.RAZORPAY_KEY_ID
        key_secret = self._settings.RAZORPAY_KEY_SECRET
        if not key_id or not key_secret:
            raise HTTPException(
                status_code=500,
                detail="Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend env.",
            )
        return key_id, key_secret

    def _is_test_mode(self) -> bool:
        """Detect if Razorpay is in test mode based on key ID prefix."""
        key_id = self._settings.RAZORPAY_KEY_ID
        return key_id.startswith("rzp_test_") if key_id else False

    def _auth_header(self) -> str:
        key_id, key_secret = self._get_api_credentials()
        encoded = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("ascii")
        return f"Basic {encoded}"

    @staticmethod
    def _to_subunits(amount: Decimal) -> int:
        return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    def _post_json(self, url: str, payload: dict[str, object]) -> dict[str, object]:
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(
            url,
            data=body,
            headers={
                "Authorization": self._auth_header(),
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {detail or exc.reason}") from exc
        except error.URLError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach Razorpay order API") from exc

    def create_order(self, request: PaymentOrderRequest) -> PaymentOrderResult:
        amount_subunits = self._to_subunits(request.amount)
        payload = {
            "amount": amount_subunits,
            "currency": request.currency,
            "receipt": request.booking_reference,
            "notes": {
                "booking_reference": request.booking_reference,
            },
        }
        response = self._post_json(self._orders_endpoint, payload)
        order_id = str(response.get("id", "")).strip()
        currency = str(response.get("currency", request.currency)).strip() or request.currency
        response_amount = response.get("amount", amount_subunits)

        if not order_id:
            raise HTTPException(status_code=502, detail="Razorpay order API did not return an order id")

        mode = "test" if self._is_test_mode() else "live"

        return PaymentOrderResult(
            provider=self.provider_name,
            mode=mode,
            key_id=self._settings.RAZORPAY_KEY_ID,
            order_id=order_id,
            amount_subunits=int(response_amount),
            currency=currency,
            provider_payload=response,
        )

    def verify_payment(self, request: PaymentVerificationRequest) -> PaymentVerificationResult:
        _, key_secret = self._get_api_credentials()
        message = f"{request.order_id}|{request.payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            key_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, request.signature):
            raise HTTPException(status_code=400, detail="Payment signature verification failed")

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
        webhook_secret = self._settings.RAZORPAY_WEBHOOK_SECRET
        if not webhook_secret:
            raise HTTPException(
                status_code=500,
                detail="Razorpay webhook secret is missing. Set RAZORPAY_WEBHOOK_SECRET in backend env.",
            )

        expected_signature = hmac.new(
            webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected_signature, signature):
            raise HTTPException(status_code=400, detail="Webhook signature verification failed")

        event_payload = json.loads(payload.decode("utf-8"))
        event_name = str(event_payload.get("event", "")).strip()
        payment_entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_entity = event_payload.get("payload", {}).get("order", {}).get("entity", {})

        order_id = str(payment_entity.get("order_id") or order_entity.get("id") or "").strip()
        payment_id_value = payment_entity.get("id")
        payment_id = str(payment_id_value).strip() if payment_id_value else None

        if not order_id:
            return None

        if event_name in {"payment.captured", "payment.authorized", "order.paid"}:
            status = "success"
        elif event_name == "payment.failed":
            status = "failure"
        else:
            status = "pending"

        return PaymentWebhookEvent(
            status=status,
            order_id=order_id,
            payment_id=payment_id,
            provider_payload=event_payload,
        )