"""Booking-specific API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
import logging
import re
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user, get_optional_current_user, require_admin_api_key
from app.core.database import get_db_session
from app.models.booking import Booking, BookingPayment, BookingQuestionResponse, BookingQuestionTemplate
from app.models.professional import Professional, ProfessionalService
from app.core.config import get_settings

logger = logging.getLogger(__name__)
from app.schemas.booking import (
    BookingHistoryItemOut,
    BookingHistoryOut,
    BookingQuestionOut,
    BookingQuestionsPageOut,
    CreatePaymentOrderIn,
    CreatePaymentOrderOut,
    PromotionalEligibilityOut,
    SubmitBookingAnswersIn,
    SubmitBookingAnswersOut,
    VerifyPaymentIn,
    VerifyPaymentOut,
)
from app.services.payments.service import create_payment_order as create_payment_order_service
from app.services.payments.service import process_payment_webhook as process_payment_webhook_service
from app.services.payments.service import verify_payment as verify_payment_service

router = APIRouter(prefix="/booking", tags=["booking"])
admin_router = APIRouter(prefix="/admin/payments", tags=["admin-payments"])


def _normalize_required_question_ids(templates: list[BookingQuestionTemplate]) -> list[int]:
    return [template.id for template in templates if template.is_required]


def _is_safe_route(route: str | None) -> str:
    if route and route.startswith("/"):
        return route
    return "/authorized"


def _to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _generate_booking_reference() -> str:
    return f"bk_{uuid.uuid4().hex}"


def _is_promotional_service(service_name: str, _amount: Decimal) -> bool:
    return service_name.strip().lower() == "initial consultation"


def _compute_discounted_amount(
    base_amount: Decimal,
    offers: str | None,
    offer_type: str | None,
    offer_value: int | None,
) -> Decimal:
    if base_amount <= Decimal("0"):
        return Decimal("0")

    normalized_offer_type = (offer_type or "none").strip().lower()
    if normalized_offer_type in {"percentage", "percent"} and offer_value is not None:
        discount = (base_amount * Decimal(str(offer_value))) / Decimal("100")
        return max(base_amount - discount, Decimal("0"))

    if normalized_offer_type == "flat" and offer_value is not None:
        return max(base_amount - Decimal(str(offer_value)), Decimal("0"))

    if normalized_offer_type == "free":
        return Decimal("0")

    if normalized_offer_type == "cashback":
        return base_amount

    if not offers:
        return base_amount

    normalized = offers.lower().strip()
    if "free" in normalized:
        return Decimal("0")

    percent_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*off", normalized)
    if percent_match:
        percent = Decimal(percent_match.group(1))
        discount = (base_amount * percent) / Decimal("100")
        discounted = base_amount - discount
        return max(discounted, Decimal("0"))

    flat_match = re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:off|discount)", normalized)
    if flat_match:
        discount = Decimal(flat_match.group(1))
        discounted = base_amount - discount
        return max(discounted, Decimal("0"))

    return base_amount


async def _resolve_service_amount(
    *,
    db: AsyncSession,
    professional_id: uuid.UUID,
    service_name: str,
) -> Decimal:
    service_result = await db.execute(
        select(
            ProfessionalService.price,
            ProfessionalService.offers,
            ProfessionalService.offer_type,
            ProfessionalService.offer_value,
        )
        .where(
            ProfessionalService.professional_id == professional_id,
            func.lower(func.trim(ProfessionalService.name)) == service_name.strip().lower(),
            ProfessionalService.is_active.is_(True),
        )
        .limit(1)
    )
    service_row = service_result.one_or_none()
    if service_row is None:
        raise HTTPException(status_code=404, detail="Service not found for this professional")

    base_amount = Decimal(str(service_row[0]))
    return _compute_discounted_amount(
        base_amount,
        service_row[1],
        service_row[2],
        service_row[3],
    )


async def _has_claimed_promotional_service(
    *,
    db: AsyncSession,
    professional_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    result = await db.execute(
        select(Booking.id)
        .outerjoin(BookingPayment, BookingPayment.booking_id == Booking.id)
        .where(
            Booking.professional_id == professional_id,
            Booking.client_user_id == user_id,
            func.lower(func.trim(Booking.service_name)) == "initial consultation",
            or_(
                Booking.status == "confirmed",
                BookingPayment.status == "success",
            ),
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


@router.get("/questions/{professional_username}", response_model=BookingQuestionsPageOut)
async def get_booking_questions(
    professional_username: str,
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> BookingQuestionsPageOut:
    professional_id_result = await db.execute(
        select(Professional.user_id).where(Professional.username == professional_username)
    )
    professional_id = professional_id_result.scalar_one_or_none()

    if professional_id is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    templates_result = await db.execute(
        select(BookingQuestionTemplate)
        .where(
            BookingQuestionTemplate.professional_id == professional_id,
            BookingQuestionTemplate.is_active.is_(True),
        )
        .order_by(BookingQuestionTemplate.display_order.asc(), BookingQuestionTemplate.id.asc())
        .limit(2)
    )
    templates = templates_result.scalars().all()

    if not templates:
        return BookingQuestionsPageOut(questions=[], already_answered=True)

    required_question_ids = _normalize_required_question_ids(templates)
    already_answered = False

    if current_user is not None and required_question_ids:
        answer_count_result = await db.execute(
            select(func.count(BookingQuestionResponse.id)).where(
                BookingQuestionResponse.professional_id == professional_id,
                BookingQuestionResponse.client_user_id == current_user.user_id,
                BookingQuestionResponse.template_question_id.in_(required_question_ids),
            )
        )
        already_answered = (answer_count_result.scalar_one() or 0) >= len(required_question_ids)

    return BookingQuestionsPageOut(
        questions=[
            BookingQuestionOut(
                id=template.id,
                prompt=template.prompt,
                display_order=template.display_order,
                is_required=template.is_required,
            )
            for template in templates
        ],
        already_answered=already_answered,
    )


@router.get("/promotions/{professional_username}/eligibility", response_model=PromotionalEligibilityOut)
async def get_promotional_eligibility(
    professional_username: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PromotionalEligibilityOut:
    professional_id_result = await db.execute(
        select(Professional.user_id).where(Professional.username == professional_username)
    )
    professional_id = professional_id_result.scalar_one_or_none()

    if professional_id is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    already_claimed = await _has_claimed_promotional_service(
        db=db,
        professional_id=professional_id,
        user_id=current_user.user_id,
    )

    return PromotionalEligibilityOut(
        eligible=not already_claimed,
        already_claimed=already_claimed,
    )


@router.post("/questions/{professional_username}/responses", response_model=SubmitBookingAnswersOut)
async def submit_booking_answers(
    professional_username: str,
    payload: SubmitBookingAnswersIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SubmitBookingAnswersOut:
    professional_id_result = await db.execute(
        select(Professional.user_id).where(Professional.username == professional_username)
    )
    professional_id = professional_id_result.scalar_one_or_none()

    if professional_id is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    templates_result = await db.execute(
        select(BookingQuestionTemplate)
        .where(
            BookingQuestionTemplate.professional_id == professional_id,
            BookingQuestionTemplate.is_active.is_(True),
        )
        .order_by(BookingQuestionTemplate.display_order.asc(), BookingQuestionTemplate.id.asc())
        .limit(2)
    )
    templates = templates_result.scalars().all()

    if not templates:
        return SubmitBookingAnswersOut(saved=True, already_answered=True)

    allowed_question_ids = {template.id for template in templates}
    required_question_ids = set(_normalize_required_question_ids(templates))

    answers_by_question_id = {
        answer.question_id: answer.answer.strip()
        for answer in payload.answers
        if answer.question_id in allowed_question_ids and answer.answer.strip()
    }

    missing_required = [
        question_id for question_id in required_question_ids if not answers_by_question_id.get(question_id)
    ]
    if missing_required:
        raise HTTPException(status_code=400, detail="Please answer all required questions")

    existing_result = await db.execute(
        select(BookingQuestionResponse).where(
            BookingQuestionResponse.professional_id == professional_id,
            BookingQuestionResponse.client_user_id == current_user.user_id,
            BookingQuestionResponse.template_question_id.in_(allowed_question_ids),
        )
    )
    existing_rows = existing_result.scalars().all()
    existing_by_question_id = {row.template_question_id: row for row in existing_rows}

    already_answered = all(question_id in existing_by_question_id for question_id in required_question_ids)

    if already_answered:
        return SubmitBookingAnswersOut(saved=True, already_answered=True)

    for question_id, answer_text in answers_by_question_id.items():
        existing = existing_by_question_id.get(question_id)
        if existing:
            existing.answer = answer_text
            continue

        db.add(
            BookingQuestionResponse(
                professional_id=professional_id,
                client_user_id=current_user.user_id,
                template_question_id=question_id,
                answer=answer_text,
            )
        )

    await db.commit()

    logger.info(
        "Booking answers submitted",
        extra={
            "user_id": str(current_user.user_id),
            "professional_id": str(professional_id),
            "professional_username": professional_username,
            "question_count": len(answers_by_question_id),
        },
    )

    return SubmitBookingAnswersOut(saved=True, already_answered=False)


@router.post("/payments/order", response_model=CreatePaymentOrderOut)
async def create_payment_order(
    payload: CreatePaymentOrderIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CreatePaymentOrderOut:
    professional_id_result = await db.execute(
        select(Professional.user_id).where(Professional.username == payload.professional_username)
    )
    professional_id = professional_id_result.scalar_one_or_none()

    if professional_id is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    canonical_amount = await _resolve_service_amount(
        db=db,
        professional_id=professional_id,
        service_name=payload.service_name,
    )

    if _is_promotional_service(payload.service_name, canonical_amount):
        already_claimed = await _has_claimed_promotional_service(
            db=db,
            professional_id=professional_id,
            user_id=current_user.user_id,
        )
        if already_claimed:
            raise HTTPException(
                status_code=409,
                detail="Initial/free consultation already claimed for this professional",
            )

    booking_reference = _generate_booking_reference()
    normalized_payload = payload.model_copy(update={"amount": float(canonical_amount)})
    return await create_payment_order_service(
        payload=normalized_payload,
        booking_reference=booking_reference,
        current_user_id=current_user.user_id,
        db=db,
        settings=get_settings(),
    )


@router.post("/payments/verify", response_model=VerifyPaymentOut)
async def verify_payment(
    payload: VerifyPaymentIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> VerifyPaymentOut:
    return await verify_payment_service(
        payload=payload,
        current_user_id=current_user.user_id,
        db=db,
        settings=get_settings(),
    )


@router.post("/payments/webhooks/razorpay", status_code=status.HTTP_202_ACCEPTED)
async def process_razorpay_webhook(
    request: Request,
    razorpay_signature: str | None = Header(default=None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, object]:
    if not razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay webhook signature")

    return await process_payment_webhook_service(
        payload=await request.body(),
        signature=razorpay_signature,
        db=db,
        settings=get_settings(),
    )


@router.get("/history/me", response_model=BookingHistoryOut)
async def get_booking_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> BookingHistoryOut:
    logger.info(
        "Booking history requested",
        extra={
            "user_id": str(current_user.user_id),
        },
    )
    bookings_result = await db.execute(
        select(Booking, Professional.username)
        .join(Professional, Professional.user_id == Booking.professional_id)
        .where(Booking.client_user_id == current_user.user_id)
        .order_by(Booking.created_at.desc())
        .limit(100)
    )
    booking_rows = bookings_result.all()

    if not booking_rows:
        return BookingHistoryOut(
            latest_booking=None,
            next_booking=None,
            immediate_bookings=[],
            upcoming_bookings=[],
            past_bookings=[],
        )

    booking_ids = [booking.id for booking, _ in booking_rows]
    payments_result = await db.execute(
        select(BookingPayment)
        .where(BookingPayment.booking_id.in_(booking_ids))
        .order_by(BookingPayment.updated_at.desc())
    )
    payment_rows = payments_result.scalars().all()

    payment_status_by_booking: dict[int, str] = {}
    for payment in payment_rows:
        if payment.booking_id not in payment_status_by_booking:
            payment_status_by_booking[payment.booking_id] = payment.status

    history_items: list[BookingHistoryItemOut] = [
        BookingHistoryItemOut(
            booking_reference=booking.booking_reference,
            professional_username=professional_username,
            service_name=booking.service_name,
            status=booking.status,
            scheduled_for=booking.scheduled_for,
            is_immediate=booking.is_immediate,
            created_at=booking.created_at,
            payment_status=payment_status_by_booking.get(booking.id),
        )
        for booking, professional_username in booking_rows
    ]

    now = datetime.now(timezone.utc)
    immediate = [item for item in history_items if item.is_immediate]
    immediate.sort(key=lambda item: item.created_at, reverse=True)

    upcoming = [
        item
        for item in history_items
        if not item.is_immediate and _to_utc(item.scheduled_for) is not None and _to_utc(item.scheduled_for) >= now
    ]
    upcoming.sort(key=lambda item: _to_utc(item.scheduled_for) or now)

    past = [
        item
        for item in history_items
        if not item.is_immediate and _to_utc(item.scheduled_for) is not None and _to_utc(item.scheduled_for) < now
    ]
    past.sort(key=lambda item: _to_utc(item.scheduled_for) or now, reverse=True)

    latest_booking = max(history_items, key=lambda item: item.created_at)
    next_booking = upcoming[0] if upcoming else None

    return BookingHistoryOut(
        latest_booking=latest_booking,
        next_booking=next_booking,
        immediate_bookings=immediate,
        upcoming_bookings=upcoming,
        past_bookings=past,
    )


# ── Admin: Payment History ────────────────────────────────────────────────────

@admin_router.get("/booking/{booking_reference}")
async def get_payment_history(
    booking_reference: str,
    db: AsyncSession = Depends(get_db_session),
    _admin_check: None = Depends(require_admin_api_key),
) -> dict[str, object]:
    """
    Get payment history for a booking by booking reference.
    Requires ADMIN_API_KEY header.
    """
    booking_result = await db.execute(
        select(Booking).where(Booking.booking_reference == booking_reference)
    )
    booking = booking_result.scalar_one_or_none()
    
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    payment_result = await db.execute(
        select(BookingPayment).where(BookingPayment.booking_id == booking.id)
        .order_by(BookingPayment.created_at.desc())
    )
    payments = payment_result.scalars().all()

    return {
        "booking_reference": booking.booking_reference,
        "booking_id": booking.id,
        "professional_id": str(booking.professional_id),
        "client_user_id": str(booking.client_user_id) if booking.client_user_id else None,
        "service_name": booking.service_name,
        "booking_status": booking.status,
        "scheduled_for": booking.scheduled_for.isoformat() if booking.scheduled_for else None,
        "is_immediate": booking.is_immediate,
        "created_at": booking.created_at.isoformat(),
        "payments": [
            {
                "id": payment.id,
                "provider": payment.provider,
                "provider_order_id": payment.provider_order_id,
                "provider_payment_id": payment.provider_payment_id,
                "provider_signature": payment.provider_signature,
                "provider_payload": payment.provider_payload,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
                "verified_at": payment.verified_at.isoformat() if payment.verified_at else None,
                "created_at": payment.created_at.isoformat(),
                "updated_at": payment.updated_at.isoformat(),
            }
            for payment in payments
        ],
    }
