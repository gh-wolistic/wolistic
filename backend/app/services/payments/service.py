from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.booking import Booking, BookingPayment
from app.models.professional import Professional
from app.schemas.booking import CreatePaymentOrderIn, CreatePaymentOrderOut, VerifyPaymentIn, VerifyPaymentOut
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentProvider,
    PaymentVerificationRequest,
)
from app.services.payments.providers.mock import MockPaymentProvider
from app.services.payments.providers.razorpay import RazorpayPaymentProvider


def _is_safe_route(route: str | None) -> str:
    if route and route.startswith("/"):
        return route
    return "/authorized"


def _resolve_booking_status(payment_status: str) -> str:
    if payment_status == "success":
        return "confirmed"
    if payment_status == "failure":
        return "failed"
    return "pending"


def get_payment_provider(settings: Settings) -> PaymentProvider:
    if settings.PAYMENT_PROVIDER == "mock":
        return MockPaymentProvider(settings)

    if settings.PAYMENT_PROVIDER == "razorpay":
        return RazorpayPaymentProvider(settings)

    raise HTTPException(status_code=500, detail="Unsupported payment provider configuration")


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _merge_provider_payload(
    existing_payload: dict[str, object] | None,
    incoming_payload: dict[str, object] | None,
) -> dict[str, object] | None:
    if existing_payload is None:
        return incoming_payload
    if incoming_payload is None:
        return existing_payload
    return {**existing_payload, **incoming_payload}


async def _get_professional_or_404(
    db: AsyncSession,
    professional_username: str,
) -> tuple[object, str]:
    professional_result = await db.execute(
        select(Professional.user_id, Professional.username).where(Professional.username == professional_username)
    )
    professional_row = professional_result.one_or_none()
    if professional_row is None:
        raise HTTPException(status_code=404, detail="Professional not found")
    return professional_row


async def _get_booking_for_user_or_404(
    db: AsyncSession,
    booking_reference: str,
    user_id: object,
) -> Booking:
    booking_result = await db.execute(
        select(Booking).where(
            Booking.booking_reference == booking_reference,
            Booking.client_user_id == user_id,
        )
    )
    booking = booking_result.scalar_one_or_none()

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    return booking


async def create_payment_order(
    *,
    payload: CreatePaymentOrderIn,
    booking_reference: str,
    current_user_id: object,
    db: AsyncSession,
    settings: Settings,
) -> CreatePaymentOrderOut:
    professional_id, _ = await _get_professional_or_404(db, payload.professional_username)

    booking = Booking(
        booking_reference=booking_reference,
        professional_id=professional_id,
        client_user_id=current_user_id,
        service_name=payload.service_name,
        status="pending",
        scheduled_for=payload.booking_at,
        is_immediate=payload.is_immediate,
    )
    db.add(booking)
    await db.flush()

    amount_decimal = Decimal(str(payload.amount))
    if amount_decimal <= 0:
        booking.status = "confirmed"
        free_payment = BookingPayment(
            booking_id=booking.id,
            provider="free",
            provider_order_id=f"free_{booking.booking_reference}",
            amount=Decimal("0"),
            currency=payload.currency,
            status="success",
        )
        db.add(free_payment)
        await db.commit()
        return CreatePaymentOrderOut(
            mode="free",
            key_id="",
            order_id=f"free_{booking.booking_reference}",
            booking_reference=booking.booking_reference,
            amount_subunits=0,
            currency=payload.currency,
        )

    provider = get_payment_provider(settings)
    provider_order = provider.create_order(
        request=PaymentOrderRequest(
            amount=amount_decimal,
            currency=payload.currency,
            booking_reference=booking.booking_reference,
        )
    )

    payment = BookingPayment(
        booking_id=booking.id,
        provider=provider_order.provider,
        provider_order_id=provider_order.order_id,
        provider_payload=provider_order.provider_payload,
        amount=amount_decimal,
        currency=provider_order.currency,
        status="created",
    )
    db.add(payment)
    await db.commit()

    return CreatePaymentOrderOut(
        mode=provider_order.mode,
        key_id=provider_order.key_id,
        order_id=provider_order.order_id,
        booking_reference=booking.booking_reference,
        amount_subunits=provider_order.amount_subunits,
        currency=provider_order.currency,
    )


async def verify_payment(
    *,
    payload: VerifyPaymentIn,
    current_user_id: object,
    db: AsyncSession,
    settings: Settings,
) -> VerifyPaymentOut:
    booking = await _get_booking_for_user_or_404(db, payload.booking_reference, current_user_id)

    booking.service_name = payload.service_name
    booking.scheduled_for = payload.booking_at or booking.scheduled_for
    booking.is_immediate = payload.is_immediate

    payment_result = await db.execute(
        select(BookingPayment).where(
            BookingPayment.provider_order_id == payload.razorpay_order_id,
            BookingPayment.booking_id == booking.id,
        )
    )
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        raise HTTPException(status_code=404, detail="Payment order not found")

    if payment.provider_payment_id and payment.provider_payment_id != payload.razorpay_payment_id:
        raise HTTPException(status_code=409, detail="Payment has already been verified with a different payment id")

    provider = get_payment_provider(settings)
    verification = provider.verify_payment(
        PaymentVerificationRequest(
            order_id=payload.razorpay_order_id,
            payment_id=payload.razorpay_payment_id,
            signature=payload.razorpay_signature,
        )
    )

    payment.status = verification.status
    payment.provider_payment_id = verification.provider_payment_id
    payment.provider_signature = verification.provider_signature
    payment.provider_payload = _merge_provider_payload(payment.provider_payload, verification.provider_payload)
    payment.verified_at = _now_utc()
    booking.status = _resolve_booking_status(verification.status)

    await db.commit()

    return VerifyPaymentOut(
        status=verification.status,
        nextRoute=_is_safe_route(payload.next_route),
        booking_reference=payload.booking_reference,
    )


async def process_payment_webhook(
    *,
    payload: bytes,
    signature: str,
    db: AsyncSession,
    settings: Settings,
) -> dict[str, object]:
    provider = get_payment_provider(settings)
    event = provider.parse_webhook(payload, signature)
    if event is None:
        return {"processed": False, "reason": "ignored"}

    payment_result = await db.execute(
        select(BookingPayment).where(BookingPayment.provider_order_id == event.order_id)
    )
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        return {"processed": False, "reason": "payment_not_found", "order_id": event.order_id}

    if event.payment_id:
        if payment.provider_payment_id and payment.provider_payment_id != event.payment_id:
            raise HTTPException(status_code=409, detail="Webhook payment id does not match stored payment id")
        payment.provider_payment_id = event.payment_id

    payment.status = event.status
    payment.provider_payload = event.provider_payload
    payment.verified_at = _now_utc()
    payment.provider_signature = signature
    payment.booking.status = _resolve_booking_status(event.status)

    await db.commit()

    return {
        "processed": True,
        "status": event.status,
        "booking_reference": payment.booking.booking_reference,
    }
