from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user, require_admin_api_key
from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.models.subscription import (
    ProfessionalSubscription,
    SubscriptionBillingRecord,
    SubscriptionPaymentOrder,
    SubscriptionPlan,
    SubscriptionPriorityTicket,
)
from app.schemas.subscription import (
    BillingRecordIn,
    BillingRecordOut,
    MySubscriptionOut,
    PriorityTicketIn,
    PriorityTicketOut,
    ProfessionalSubscriptionAssign,
    ProfessionalSubscriptionOut,
    ProfessionalSubscriptionPatch,
    SubscriptionPlanIn,
    SubscriptionPlanOut,
    SubscriptionPlanPatch,
    UpgradeOrderIn,
    UpgradeOrderOut,
    UpgradeVerifyIn,
    UpgradeVerifyOut,
)
from app.services.payments.providers.base import PaymentOrderRequest, PaymentVerificationRequest
from app.services.payments.service import get_payment_provider

partner_router = APIRouter(prefix="/partners", tags=["subscription"])
admin_router = APIRouter(
    prefix="/admin/subscriptions",
    tags=["admin-subscriptions"],
    dependencies=[Depends(require_admin_api_key)],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _require_professional(
    current_user: AuthenticatedUser,
    db: AsyncSession,
) -> Professional:
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    prof = result.scalar_one_or_none()
    if prof is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professional profile not found")
    return prof


async def _build_subscription_out(sub: ProfessionalSubscription, db: AsyncSession) -> ProfessionalSubscriptionOut:
    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == sub.plan_id)
    )
    plan = plan_result.scalar_one()
    return ProfessionalSubscriptionOut(
        id=sub.id,
        professional_id=str(sub.professional_id),
        plan_id=sub.plan_id,
        plan=SubscriptionPlanOut.model_validate(plan),
        status=sub.status,
        starts_at=sub.starts_at,
        ends_at=sub.ends_at,
        auto_renew=sub.auto_renew,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


async def _build_billing_out(record: SubscriptionBillingRecord, db: AsyncSession) -> BillingRecordOut:
    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == record.plan_id)
    )
    plan = plan_result.scalar_one()
    return BillingRecordOut(
        id=record.id,
        professional_id=str(record.professional_id),
        plan_id=record.plan_id,
        plan_name=plan.name,
        amount=float(record.amount),
        currency=record.currency,
        method=record.method,
        invoice_ref=record.invoice_ref,
        paid_at=record.paid_at,
        created_at=record.created_at,
    )


# ── Partner: read my subscription ────────────────────────────────────────────

@partner_router.get("/subscription/me", response_model=MySubscriptionOut)
async def get_my_subscription(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MySubscriptionOut:
    prof = await _require_professional(current_user, db)

    # Active subscription
    sub_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.professional_id == prof.user_id
        )
    )
    sub = sub_result.scalar_one_or_none()
    sub_out = await _build_subscription_out(sub, db) if sub else None

    # Billing history
    billing_result = await db.execute(
        select(SubscriptionBillingRecord)
        .where(SubscriptionBillingRecord.professional_id == prof.user_id)
        .order_by(SubscriptionBillingRecord.paid_at.desc())
        .limit(50)
    )
    billing_records = billing_result.scalars().all()
    billing_out = [await _build_billing_out(r, db) for r in billing_records]

    # Available plans for this expert type — look up from User table
    user_result = await db.execute(
        select(User).where(User.id == prof.user_id)
    )
    user = user_result.scalar_one_or_none()
    raw_subtype = (user.user_subtype or "") if user else ""
    # user_subtype is e.g. "body_expert" → strip "_expert" suffix for plan lookup
    expert_type = raw_subtype.replace("_expert", "") if raw_subtype else "body"
    plans_result = await db.execute(
        select(SubscriptionPlan)
        .where(
            SubscriptionPlan.is_active.is_(True),
            SubscriptionPlan.expert_type.in_([expert_type, "all"]),
        )
        .order_by(SubscriptionPlan.display_order)
    )
    plans = plans_result.scalars().all()
    plans_out = [SubscriptionPlanOut.model_validate(p) for p in plans]

    return MySubscriptionOut(
        subscription=sub_out,
        billing_history=billing_out,
        available_plans=plans_out,
    )


# ── Partner: create upgrade payment order ─────────────────────────────────────

@partner_router.post("/subscription/upgrade/order", response_model=UpgradeOrderOut)
async def create_upgrade_order(
    body: UpgradeOrderIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> UpgradeOrderOut:
    prof = await _require_professional(current_user, db)

    # Must be verified
    user_result = await db.execute(select(User).where(User.id == prof.user_id))
    user = user_result.scalar_one_or_none()
    if not user or user.user_status != "verified":
        raise HTTPException(status_code=403, detail="Profile must be verified to upgrade subscription")

    # Validate plan
    plan_result = await db.execute(
        select(SubscriptionPlan).where(
            SubscriptionPlan.id == body.plan_id,
            SubscriptionPlan.is_active.is_(True),
        )
    )
    plan = plan_result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found or inactive")
    if plan.tier == "celeb":
        raise HTTPException(status_code=422, detail="Celeb plan requires contacting Wolistic sales")
    if float(plan.price_monthly) <= 0:
        raise HTTPException(status_code=422, detail="Cannot create a payment order for a free plan")

    amount = Decimal(str(plan.price_monthly))
    order_ref = f"sub_{uuid.uuid4().hex[:16]}"

    provider = get_payment_provider(settings)
    provider_order = provider.create_order(
        request=PaymentOrderRequest(
            amount=amount,
            currency="INR",
            booking_reference=order_ref,
        )
    )

    sub_order = SubscriptionPaymentOrder(
        professional_id=prof.user_id,
        plan_id=body.plan_id,
        provider_order_id=provider_order.order_id,
        amount=amount,
        currency="INR",
        status="created",
    )
    db.add(sub_order)
    await db.commit()

    return UpgradeOrderOut(
        key_id=provider_order.key_id,
        order_id=provider_order.order_id,
        amount_subunits=provider_order.amount_subunits,
        currency=provider_order.currency,
        plan_id=plan.id,
        plan_name=plan.name,
    )


# ── Partner: verify upgrade payment and activate subscription ─────────────────

@partner_router.post("/subscription/upgrade/verify", response_model=UpgradeVerifyOut)
async def verify_upgrade_payment(
    body: UpgradeVerifyIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> UpgradeVerifyOut:
    prof = await _require_professional(current_user, db)

    order_result = await db.execute(
        select(SubscriptionPaymentOrder).where(
            SubscriptionPaymentOrder.provider_order_id == body.razorpay_order_id,
            SubscriptionPaymentOrder.professional_id == prof.user_id,
            SubscriptionPaymentOrder.plan_id == body.plan_id,
        )
    )
    order = order_result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Payment order not found")

    provider = get_payment_provider(settings)
    verification = provider.verify_payment(
        PaymentVerificationRequest(
            order_id=body.razorpay_order_id,
            payment_id=body.razorpay_payment_id,
            signature=body.razorpay_signature,
        )
    )

    order.status = verification.status
    order.provider_payment_id = verification.provider_payment_id
    order.provider_signature = verification.provider_signature

    if verification.status == "success":
        now = datetime.now(timezone.utc)
        ends_at = now + timedelta(days=30)

        existing_result = await db.execute(
            select(ProfessionalSubscription).where(
                ProfessionalSubscription.professional_id == prof.user_id
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
                professional_id=prof.user_id,
                plan_id=order.plan_id,
                status="active",
                starts_at=now,
                ends_at=ends_at,
                auto_renew=False,
            ))

        db.add(SubscriptionBillingRecord(
            professional_id=prof.user_id,
            plan_id=order.plan_id,
            amount=order.amount,
            currency=order.currency,
            method="razorpay",
            invoice_ref=body.razorpay_payment_id,
            paid_at=now,
        ))

        await db.commit()
        return UpgradeVerifyOut(status="success", message="Subscription upgraded successfully")

    await db.commit()
    return UpgradeVerifyOut(status="failure", message="Payment verification failed. Please contact support.")


# ── Partner: raise priority ticket (unverified users) ────────────────────────

@partner_router.post("/subscription/priority-ticket", response_model=PriorityTicketOut, status_code=status.HTTP_201_CREATED)
async def raise_priority_ticket(
    body: PriorityTicketIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PriorityTicketOut:
    prof = await _require_professional(current_user, db)

    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == body.plan_id)
    )
    if plan_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    ticket = SubscriptionPriorityTicket(
        professional_id=prof.user_id,
        plan_id=body.plan_id,
        message=body.message,
        status="open",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return PriorityTicketOut.model_validate(ticket)


# ── Admin: Plans CRUD ─────────────────────────────────────────────────────────

@admin_router.get("/plans", response_model=List[SubscriptionPlanOut])
async def list_plans(
    expert_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
) -> List[SubscriptionPlanOut]:
    q = select(SubscriptionPlan).order_by(SubscriptionPlan.display_order)
    if expert_type:
        q = q.where(SubscriptionPlan.expert_type == expert_type)
    result = await db.execute(q)
    plans = result.scalars().all()
    return [SubscriptionPlanOut.model_validate(p) for p in plans]


@admin_router.post("/plans", response_model=SubscriptionPlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(
    body: SubscriptionPlanIn,
    db: AsyncSession = Depends(get_db_session),
) -> SubscriptionPlanOut:
    plan = SubscriptionPlan(**body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return SubscriptionPlanOut.model_validate(plan)


@admin_router.patch("/plans/{plan_id}", response_model=SubscriptionPlanOut)
async def update_plan(
    plan_id: int,
    body: SubscriptionPlanPatch,
    db: AsyncSession = Depends(get_db_session),
) -> SubscriptionPlanOut:
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.commit()
    await db.refresh(plan)
    return SubscriptionPlanOut.model_validate(plan)


@admin_router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    await db.delete(plan)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Admin: Assign / manage professional subscriptions ────────────────────────

@admin_router.get("/assigned", response_model=List[ProfessionalSubscriptionOut])
async def list_assigned_subscriptions(
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db_session),
) -> List[ProfessionalSubscriptionOut]:
    q = select(ProfessionalSubscription)
    if status_filter:
        q = q.where(ProfessionalSubscription.status == status_filter)
    q = q.order_by(ProfessionalSubscription.created_at.desc())
    result = await db.execute(q)
    subs = result.scalars().all()
    return [await _build_subscription_out(s, db) for s in subs]


@admin_router.post("/assigned", response_model=ProfessionalSubscriptionOut, status_code=status.HTTP_201_CREATED)
async def assign_subscription(
    body: ProfessionalSubscriptionAssign,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalSubscriptionOut:
    try:
        prof_uuid = uuid.UUID(body.professional_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid professional_id UUID")

    # Check professional exists
    prof_result = await db.execute(
        select(Professional).where(Professional.user_id == prof_uuid)
    )
    if prof_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Professional not found")

    # Check plan exists
    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == body.plan_id)
    )
    if plan_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Upsert: if subscription exists update it, otherwise create
    existing_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.professional_id == prof_uuid
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.plan_id = body.plan_id
        existing.status = body.status
        existing.starts_at = body.starts_at
        existing.ends_at = body.ends_at
        existing.auto_renew = body.auto_renew
        sub = existing
    else:
        sub = ProfessionalSubscription(
            professional_id=prof_uuid,
            plan_id=body.plan_id,
            status=body.status,
            starts_at=body.starts_at,
            ends_at=body.ends_at,
            auto_renew=body.auto_renew,
        )
        db.add(sub)

    await db.commit()
    await db.refresh(sub)
    return await _build_subscription_out(sub, db)


@admin_router.patch("/assigned/{subscription_id}", response_model=ProfessionalSubscriptionOut)
async def patch_assigned_subscription(
    subscription_id: int,
    body: ProfessionalSubscriptionPatch,
    db: AsyncSession = Depends(get_db_session),
) -> ProfessionalSubscriptionOut:
    result = await db.execute(
        select(ProfessionalSubscription).where(ProfessionalSubscription.id == subscription_id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(sub, field, value)
    await db.commit()
    await db.refresh(sub)
    return await _build_subscription_out(sub, db)


@admin_router.delete("/assigned/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assigned_subscription(
    subscription_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    result = await db.execute(
        select(ProfessionalSubscription).where(ProfessionalSubscription.id == subscription_id)
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    await db.delete(sub)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Admin: Billing records ────────────────────────────────────────────────────

@admin_router.get("/billing", response_model=List[BillingRecordOut])
async def list_billing_records(
    professional_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
) -> List[BillingRecordOut]:
    q = select(SubscriptionBillingRecord).order_by(SubscriptionBillingRecord.paid_at.desc())
    if professional_id:
        try:
            prof_uuid = uuid.UUID(professional_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid professional_id UUID")
        q = q.where(SubscriptionBillingRecord.professional_id == prof_uuid)
    result = await db.execute(q)
    records = result.scalars().all()
    return [await _build_billing_out(r, db) for r in records]


@admin_router.post("/billing", response_model=BillingRecordOut, status_code=status.HTTP_201_CREATED)
async def create_billing_record(
    body: BillingRecordIn,
    db: AsyncSession = Depends(get_db_session),
) -> BillingRecordOut:
    try:
        prof_uuid = uuid.UUID(body.professional_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid professional_id UUID")

    record = SubscriptionBillingRecord(
        professional_id=prof_uuid,
        plan_id=body.plan_id,
        amount=body.amount,
        currency=body.currency,
        method=body.method,
        invoice_ref=body.invoice_ref,
        paid_at=body.paid_at,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return await _build_billing_out(record, db)
