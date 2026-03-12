from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


PaymentLifecycleStatus = str


@dataclass(slots=True)
class PaymentOrderRequest:
    amount: Decimal
    currency: str
    booking_reference: str


@dataclass(slots=True)
class PaymentOrderResult:
    provider: str
    mode: str
    key_id: str
    order_id: str
    amount_subunits: int
    currency: str
    provider_payload: dict[str, object] | None = None


@dataclass(slots=True)
class PaymentVerificationRequest:
    order_id: str
    payment_id: str
    signature: str


@dataclass(slots=True)
class PaymentVerificationResult:
    status: PaymentLifecycleStatus
    provider_payment_id: str
    provider_signature: str
    provider_payload: dict[str, object] | None = None


@dataclass(slots=True)
class PaymentWebhookEvent:
    status: PaymentLifecycleStatus
    order_id: str
    payment_id: str | None
    provider_payload: dict[str, object]


class PaymentProvider(Protocol):
    provider_name: str

    def create_order(self, request: PaymentOrderRequest) -> PaymentOrderResult:
        ...

    def verify_payment(self, request: PaymentVerificationRequest) -> PaymentVerificationResult:
        ...

    def parse_webhook(self, payload: bytes, signature: str) -> PaymentWebhookEvent | None:
        ...
