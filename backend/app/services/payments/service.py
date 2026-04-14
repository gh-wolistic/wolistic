from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.booking import Booking, BookingPayment
from app.models.professional import Professional
from app.schemas.booking import CreatePaymentOrderIn, CreatePaymentOrderOut, VerifyPaymentIn, VerifyPaymentOut
from app.services.coins import award_coins
from app.services.payments.providers.base import (
    PaymentOrderRequest,
    PaymentProvider,
    PaymentVerificationRequest,
)
from app.services.payments.providers.razorpay import RazorpayPaymentProvider


logger = logging.getLogger(__name__)


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
    if settings.PAYMENT_PROVIDER == "razorpay":
        return RazorpayPaymentProvider(settings)

    raise HTTPException(status_code=500, detail="Unsupported payment provider configuration")


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def _is_first_confirmed_booking(db: AsyncSession, client_user_id: uuid.UUID, exclude_booking_id: int) -> bool:
    """Return True if this is the only confirmed booking the client has (i.e. their first)."""
    result = await db.execute(
        select(func.count(Booking.id)).where(
            Booking.client_user_id == client_user_id,
            Booking.status == "confirmed",
            Booking.id != exclude_booking_id,
        )
    )
    prior_count = result.scalar_one() or 0
    return prior_count == 0


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
        raise HTTPException(status_code=422, detail="Amount must be greater than zero for Razorpay checkout")

    logger.info(
        "Creating payment order",
        extra={
            "user_id": str(current_user_id),
            "professional_username": payload.professional_username,
            "amount": str(amount_decimal),
            "currency": payload.currency,
            "booking_reference": booking.booking_reference,
            "coins_to_use": getattr(payload, "coins_to_use", 0),
        },
    )

    provider = get_payment_provider(settings)
    provider_order = provider.create_order(
        request=PaymentOrderRequest(
            amount=amount_decimal,
            currency=payload.currency,
            booking_reference=booking.booking_reference,
        )
    )

    logger.info(
        "Payment order created successfully",
        extra={
            "user_id": str(current_user_id),
            "order_id": provider_order.order_id,
            "amount_subunits": provider_order.amount_subunits,
            "currency": provider_order.currency,
            "provider": provider_order.provider,
        },
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

    logger.info(
        "Payment verification attempted",
        extra={
            "user_id": str(current_user_id),
            "booking_reference": payload.booking_reference,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "signature_prefix": payload.razorpay_signature[:16] if payload.razorpay_signature else None,
        },
    )

    payment_result = await db.execute(
        select(BookingPayment).where(
            BookingPayment.provider_order_id == payload.razorpay_order_id,
            BookingPayment.booking_id == booking.id,
        )
    )
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        logger.warning(
            "Payment verification failed - order not found",
            extra={
                "user_id": str(current_user_id),
                "razorpay_order_id": payload.razorpay_order_id,
                "booking_reference": payload.booking_reference,
            },
        )
        raise HTTPException(status_code=404, detail="Payment order not found")

    if payment.provider_payment_id and payment.provider_payment_id != payload.razorpay_payment_id:
        logger.error(
            "Payment verification failed - payment ID mismatch",
            extra={
                "user_id": str(current_user_id),
                "razorpay_order_id": payload.razorpay_order_id,
                "existing_payment_id": payment.provider_payment_id,
                "new_payment_id": payload.razorpay_payment_id,
            },
        )
        raise HTTPException(status_code=409, detail="Payment has already been verified with a different payment id")

    provider = get_payment_provider(settings)
    try:
        verification = provider.verify_payment(
            PaymentVerificationRequest(
                order_id=payload.razorpay_order_id,
                payment_id=payload.razorpay_payment_id,
                signature=payload.razorpay_signature,
            )
        )
    except HTTPException as e:
        logger.error(
            "Payment signature verification failed",
            extra={
                "user_id": str(current_user_id),
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "error_status": e.status_code,
                "error_detail": e.detail,
            },
        )
        raise

    payment.status = verification.status
    payment.provider_payment_id = verification.provider_payment_id
    payment.provider_signature = verification.provider_signature
    payment.provider_payload = _merge_provider_payload(payment.provider_payload, verification.provider_payload)
    payment.verified_at = _now_utc()
    booking.status = _resolve_booking_status(verification.status)

    logger.info(
        "Payment verification successful",
        extra={
            "user_id": str(current_user_id),
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": verification.provider_payment_id,
            "payment_status": verification.status,
            "booking_status": booking.status,
            "booking_id": booking.id,
        },
    )

    # Award coins on confirmed booking — both sides of the transaction.
    if booking.status == "confirmed":
        await award_coins(
            db,
            user_id=booking.client_user_id,
            event_type="booking_cashback",
            reference_type="booking",
            reference_id=str(booking.id),
        )
        await award_coins(
            db,
            user_id=booking.professional_id,
            event_type="session_complete",
            reference_type="booking",
            reference_id=str(booking.id),
        )
        # One-time first-booking bonus for clients.
        if await _is_first_confirmed_booking(db, booking.client_user_id, booking.id):
            await award_coins(
                db,
                user_id=booking.client_user_id,
                event_type="first_booking",
                reference_type="user",
                reference_id=str(booking.client_user_id),
            )

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
    logger.info(
        "Webhook received",
        extra={
            "payload_size_bytes": len(payload),
            "signature_prefix": signature[:16] if signature else None,
        },
    )

    provider = get_payment_provider(settings)
    try:
        event = provider.parse_webhook(payload, signature)
    except HTTPException as e:
        logger.error(
            "Webhook signature verification failed",
            extra={
                "error_status": e.status_code,
                "error_detail": e.detail,
            },
        )
        raise

    if event is None:
        logger.info("Webhook ignored - no relevant event found")
        return {"processed": False, "reason": "ignored"}

    logger.info(
        "Webhook parsed successfully",
        extra={
            "event_status": event.status,
            "order_id": event.order_id,
            "payment_id": event.payment_id,
        },
    )

    payment_result = await db.execute(
        select(BookingPayment).where(BookingPayment.provider_order_id == event.order_id)
    )
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        logger.warning(
            "Webhook payment not found",
            extra={"order_id": event.order_id},
        )
        return {"processed": False, "reason": "payment_not_found", "order_id": event.order_id}

    # Idempotency protection: Check if this webhook has already been processed
    if event.payment_id:
        if payment.provider_payment_id and payment.provider_payment_id != event.payment_id:
            logger.error(
                "Webhook payment ID mismatch",
                extra={
                    "order_id": event.order_id,
                    "existing_payment_id": payment.provider_payment_id,
                    "webhook_payment_id": event.payment_id,
                },
            )
            raise HTTPException(status_code=409, detail="Webhook payment id does not match stored payment id")
        
        # Duplicate delivery detection: same payment_id and same status
        if payment.provider_payment_id == event.payment_id and payment.status == event.status:
            logger.info(
                "Webhook duplicate delivery detected (idempotent)",
                extra={
                    "order_id": event.order_id,
                    "payment_id": event.payment_id,
                    "status": event.status,
                },
            )
            return {
                "processed": True,
                "duplicate": True,
                "status": event.status,
                "booking_reference": payment.booking.booking_reference,
            }
        
        payment.provider_payment_id = event.payment_id

    old_status = payment.status
    is_status_change = old_status != event.status
    
    payment.status = event.status
    payment.provider_payload = event.provider_payload
    payment.verified_at = _now_utc()
    payment.provider_signature = signature
    payment.booking.status = _resolve_booking_status(event.status)

    logger.info(
        "Webhook processed - payment updated",
        extra={
            "order_id": event.order_id,
            "payment_id": event.payment_id,
            "old_status": old_status,
            "new_status": event.status,
            "booking_id": payment.booking.id,
            "booking_status": payment.booking.status,
            "is_status_change": is_status_change,
        },
    )

    # Award coins only on status change from non-confirmed to confirmed
    # (prevents duplicate coin awards on duplicate webhook deliveries)
    is_newly_confirmed = payment.booking.status == "confirmed" and old_status != "confirmed"
    if is_newly_confirmed:
        await award_coins(
            db,
            user_id=payment.booking.client_user_id,
            event_type="booking_cashback",
            reference_type="booking",
            reference_id=str(payment.booking.id),
        )
        await award_coins(
            db,
            user_id=payment.booking.professional_id,
            event_type="session_complete",
            reference_type="booking",
            reference_id=str(payment.booking.id),
        )
        # One-time first-booking bonus for clients.
        if await _is_first_confirmed_booking(db, payment.booking.client_user_id, payment.booking.id):
            await award_coins(
                db,
                user_id=payment.booking.client_user_id,
                event_type="first_booking",
                reference_type="user",
                reference_id=str(payment.booking.client_user_id),
            )

    await db.commit()

    return {
        "processed": True,
        "status": event.status,
        "booking_reference": payment.booking.booking_reference,
    }


async def process_subscription_webhook(
    *,
    payload: bytes,
    signature: str,
    db: AsyncSession,
    settings: Settings,
) -> dict[str, object]:
    """Process Razorpay webhook for subscription upgrade payments."""
    from app.models.subscription import SubscriptionPaymentOrder, ProfessionalSubscription, SubscriptionBillingRecord

    logger.info(
        "Subscription webhook received",
        extra={
            "payload_size_bytes": len(payload),
            "signature_prefix": signature[:16] if signature else None,
        },
    )

    provider = get_payment_provider(settings)
    try:
        event = provider.parse_webhook(payload, signature)
    except HTTPException as e:
        logger.error(
            "Subscription webhook signature verification failed",
            extra={
                "error_status": e.status_code,
                "error_detail": e.detail,
            },
        )
        raise

    if event is None:
        logger.info("Subscription webhook ignored - no relevant event found")
        return {"processed": False, "reason": "ignored"}

    logger.info(
        "Subscription webhook parsed successfully",
        extra={
            "event_status": event.status,
            "order_id": event.order_id,
            "payment_id": event.payment_id,
        },
    )

    order_result = await db.execute(
        select(SubscriptionPaymentOrder).where(SubscriptionPaymentOrder.provider_order_id == event.order_id)
    )
    order = order_result.scalar_one_or_none()

    if order is None:
        logger.warning(
            "Subscription webhook payment order not found",
            extra={"order_id": event.order_id},
        )
        return {"processed": False, "reason": "payment_not_found", "order_id": event.order_id}

    # Idempotency protection
    if event.payment_id:
        if order.provider_payment_id and order.provider_payment_id != event.payment_id:
            logger.error(
                "Subscription webhook payment ID mismatch",
                extra={
                    "order_id": event.order_id,
                    "existing_payment_id": order.provider_payment_id,
                    "webhook_payment_id": event.payment_id,
                },
            )
            raise HTTPException(status_code=409, detail="Webhook payment id does not match stored payment id")
        
        # Duplicate delivery detection
        if order.provider_payment_id == event.payment_id and order.status == event.status:
            logger.info(
                "Subscription webhook duplicate delivery detected (idempotent)",
                extra={
                    "order_id": event.order_id,
                    "payment_id": event.payment_id,
                    "status": event.status,
                },
            )
            return {
                "processed": True,
                "duplicate": True,
                "status": event.status,
                "professional_id": str(order.professional_id),
            }
        
        order.provider_payment_id = event.payment_id

    old_status = order.status
    is_status_change = old_status != event.status
    
    order.status = event.status
    order.provider_signature = signature

    logger.info(
        "Subscription webhook processed - order updated",
        extra={
            "order_id": event.order_id,
            "payment_id": event.payment_id,
            "old_status": old_status,
            "new_status": event.status,
            "professional_id": str(order.professional_id),
            "is_status_change": is_status_change,
        },
    )

    # Activate subscription only on status change to success
    is_newly_successful = event.status == "success" and old_status != "success"
    if is_newly_successful:
        from datetime import datetime, timedelta, timezone
        
        now = datetime.now(timezone.utc)
        ends_at = now + timedelta(days=30)

        existing_result = await db.execute(
            select(ProfessionalSubscription).where(
                ProfessionalSubscription.professional_id == order.professional_id
            )
        )
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            existing.plan_id = order.plan_id
            existing.status = "active"
            existing.starts_at = now
            existing.ends_at = ends_at
            existing.auto_renew = False
        else:
            db.add(ProfessionalSubscription(
                professional_id=order.professional_id,
                plan_id=order.plan_id,
                status="active",
                starts_at=now,
                ends_at=ends_at,
                auto_renew=False,
            ))

        db.add(SubscriptionBillingRecord(
            professional_id=order.professional_id,
            plan_id=order.plan_id,
            amount=order.amount,
            currency=order.currency,
            method="razorpay",
            invoice_ref=event.payment_id,
            paid_at=now,
        ))

        logger.info(
            "Subscription activated via webhook",
            extra={
                "professional_id": str(order.professional_id),
                "plan_id": order.plan_id,
                "payment_id": event.payment_id,
            },
        )

    await db.commit()

    return {
        "processed": True,
        "status": event.status,
        "professional_id": str(order.professional_id),
    }
