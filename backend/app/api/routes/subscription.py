from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
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
from app.services.payments.service import get_payment_provider, process_subscription_webhook as process_subscription_webhook_service

logger = logging.getLogger(__name__)

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
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> UpgradeVerifyOut:
    prof = await _require_professional(current_user, db)

    logger.info(
        "Payment verification attempted",
        extra={
            "user_id": str(current_user.user_id),
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "plan_id": body.plan_id,
        }
    )

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
        
        logger.info(
            "Subscription activated successfully",
            extra={
                "user_id": str(prof.user_id),
                "plan_id": order.plan_id,
                "payment_id": verification.provider_payment_id,
            }
        )
        
        return UpgradeVerifyOut(status="success", message="Subscription upgraded successfully")

    await db.commit()
    return UpgradeVerifyOut(status="failure", message="Payment verification failed. Please contact support.")


@partner_router.post("/subscription/webhooks/razorpay", status_code=status.HTTP_202_ACCEPTED)
async def process_subscription_razorpay_webhook(
    request: Request,
    razorpay_signature: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    """Process Razorpay webhooks for subscription upgrade payments."""
    # Try header with alias first, then query parameter
    if razorpay_signature is None:
        from fastapi import Header
        razorpay_signature = request.headers.get("X-Razorpay-Signature")
    
    if not razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay webhook signature")

    return await process_subscription_webhook_service(
        payload=await request.body(),
        signature=razorpay_signature,
        db=db,
        settings=settings,
    )


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


# ── Partner: cancel subscription ──────────────────────────────────────────────

@partner_router.post("/subscription/cancel", response_model=dict)
async def cancel_subscription(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Cancel active subscription (sets status to 'cancelled', keeps access until end_date)"""
    prof = await _require_professional(current_user, db)
    
    # Find active subscription
    sub_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.professional_id == prof.user_id,
            ProfessionalSubscription.status == "active",
        )
    )
    sub = sub_result.scalar_one_or_none()
    if sub is None:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Set status to cancelled, disable auto-renew
    sub.status = "cancelled"
    sub.auto_renew = False
    
    await db.commit()
    
    logger.info(
        "Subscription cancelled",
        extra={
            "user_id": str(prof.user_id),
            "subscription_id": sub.id,
            "ends_at": sub.ends_at.isoformat() if sub.ends_at else None,
        }
    )
    
    return {
        "message": "Subscription cancelled successfully. Access remains until the current period ends.",
        "ends_at": sub.ends_at.isoformat() if sub.ends_at else None,
    }


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
    
    # Check for active assignments before deleting
    assignments_result = await db.execute(
        select(ProfessionalSubscription).where(ProfessionalSubscription.plan_id == plan_id)
    )
    active_assignments = assignments_result.scalars().all()
    if active_assignments:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete plan '{plan.name}' - it has {len(active_assignments)} active assignment(s). "
                   f"Remove or reassign subscriptions first."
        )
    
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


@admin_router.get("/limits/schema")
async def get_limits_schema() -> dict:
    """
    Return comprehensive limits schema with metadata.
    Used by admin UI to render limit editor dynamically.
    
    Returns limit field definitions grouped by category:
    - profile_limits: Profile infrastructure limits
    - operational_limits: Tier-based operational limits
    - feature_flags: Boolean feature access flags
    - multipliers: Performance boost multipliers
    
    Each field includes:
    - type: 'integer', 'boolean', or 'float'
    - description: Human-readable explanation
    - defaults: Default values for each tier (free, pro, elite, celeb)
    """
    return {
        "profile_limits": {
            "certificates_limit": {
                "type": "integer",
                "description": "Maximum verified certifications",
                "defaults": {"free": 3, "pro": 10, "elite": 25, "celeb": 9999},
            },
            "languages_limit": {
                "type": "integer",
                "description": "Maximum languages offered",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "education_items_limit": {
                "type": "integer",
                "description": "Maximum education entries",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "expertise_areas_limit": {
                "type": "integer",
                "description": "Maximum expertise tags",
                "defaults": {"free": 3, "pro": 10, "elite": 20, "celeb": 9999},
            },
            "approaches_limit": {
                "type": "integer",
                "description": "Maximum therapeutic approaches",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "subcategories_limit": {
                "type": "integer",
                "description": "Maximum service subcategories",
                "defaults": {"free": 2, "pro": 5, "elite": 10, "celeb": 9999},
            },
            "gallery_items_limit": {
                "type": "integer",
                "description": "Maximum gallery photos/videos",
                "defaults": {"free": 5, "pro": 20, "elite": 50, "celeb": 9999},
            },
            "booking_questions_limit": {
                "type": "integer",
                "description": "Maximum custom booking questions",
                "defaults": {"free": 0, "pro": 3, "elite": 10, "celeb": 9999},
            },
        },
        "operational_limits": {
            "services_limit": {
                "type": "integer",
                "description": "Maximum active service offerings",
                "defaults": {"free": 2, "pro": 5, "elite": 15, "celeb": 9999},
            },
            "booking_slots_limit": {
                "type": "integer",
                "description": "Maximum availability slots per month",
                "defaults": {"free": 10, "pro": 50, "elite": 200, "celeb": 9999},
            },
            "client_invites_per_day": {
                "type": "integer",
                "description": "Maximum client invites per day",
                "defaults": {"free": 1, "pro": 5, "elite": 20, "celeb": 9999},
            },
            "client_invites_per_month": {
                "type": "integer",
                "description": "Maximum client invites per month",
                "defaults": {"free": 5, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "leads_per_day": {
                "type": "integer",
                "description": "Maximum new leads accepted per day",
                "defaults": {"free": 2, "pro": 10, "elite": 50, "celeb": 9999},
            },
            "leads_total_limit": {
                "type": "integer",
                "description": "Maximum total active leads",
                "defaults": {"free": 10, "pro": 50, "elite": 200, "celeb": 9999},
            },
            "followups_per_day": {
                "type": "integer",
                "description": "Maximum follow-ups created per day",
                "defaults": {"free": 3, "pro": 20, "elite": 100, "celeb": 9999},
            },
            "followups_total_limit": {
                "type": "integer",
                "description": "Maximum active follow-ups",
                "defaults": {"free": 20, "pro": 100, "elite": 500, "celeb": 9999},
            },
            "routines_limit": {
                "type": "integer",
                "description": "Maximum active client routines",
                "defaults": {"free": 0, "pro": 10, "elite": 50, "celeb": 9999},
            },
            "routine_templates_limit": {
                "type": "integer",
                "description": "Maximum reusable routine templates",
                "defaults": {"free": 0, "pro": 5, "elite": 25, "celeb": 9999},
            },
            "group_classes_limit": {
                "type": "integer",
                "description": "Maximum active group classes",
                "defaults": {"free": 2, "pro": 5, "elite": 15, "celeb": 9999},
            },
            "activity_manager_yet_to_start_cap": {
                "type": "integer",
                "description": "Maximum 'yet to start' items in activity manager",
                "defaults": {"free": 10, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "activity_manager_in_progress_cap": {
                "type": "integer",
                "description": "Maximum 'in progress' items in activity manager",
                "defaults": {"free": 10, "pro": 30, "elite": 100, "celeb": 9999},
            },
            "classes_sessions_limit": {
                "type": "integer",
                "description": "Maximum total classes/sessions",
                "defaults": {"free": 5, "pro": 25, "elite": 100, "celeb": 9999},
            },
            "messages_retention_days": {
                "type": "integer",
                "description": "Chat history retention period (days)",
                "defaults": {"free": 30, "pro": 90, "elite": 365, "celeb": 9999},
            },
        },
        "feature_flags": {
            "can_reply_to_reviews": {
                "type": "boolean",
                "description": "Can respond to client reviews",
                "defaults": {"free": True, "pro": True, "elite": True, "celeb": True},
            },
            "can_receive_reviews": {
                "type": "boolean",
                "description": "Can receive client reviews",
                "defaults": {"free": True, "pro": True, "elite": True, "celeb": True},
            },
            "featured_in_search": {
                "type": "boolean",
                "description": "Boosted search ranking",
                "defaults": {"free": False, "pro": True, "elite": True, "celeb": True},
            },
            "priority_support": {
                "type": "boolean",
                "description": "Access to priority customer support",
                "defaults": {"free": False, "pro": False, "elite": True, "celeb": True},
            },
            "ai_routine_privacy": {
                "type": "boolean",
                "description": "AI cannot read routines for suggestions",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "white_label_branding": {
                "type": "boolean",
                "description": "Custom branding on client-facing pages",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "dedicated_account_manager": {
                "type": "boolean",
                "description": "Personal account manager",
                "defaults": {"free": False, "pro": False, "elite": False, "celeb": True},
            },
            "brand_collaboration_priority": {
                "type": "boolean",
                "description": "Priority brand partnership access",
                "defaults": {"free": False, "pro": False, "elite": True, "celeb": True},
            },
        },
        "multipliers": {
            "coin_multiplier": {
                "type": "float",
                "description": "Coin earn rate multiplier",
                "defaults": {"free": 1.0, "pro": 1.5, "elite": 2.0, "celeb": 3.0},
            },
            "search_ranking_boost": {
                "type": "float",
                "description": "Search result ranking boost",
                "defaults": {"free": 1.0, "pro": 1.25, "elite": 1.75, "celeb": 2.5},
            },
            "review_weight_multiplier": {
                "type": "float",
                "description": "Review credibility weight",
                "defaults": {"free": 1.0, "pro": 1.1, "elite": 1.3, "celeb": 1.5},
            },
        },
    }


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
    plan = plan_result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Prevent assigning coming_soon tiers
    if plan.coming_soon:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign '{plan.tier}' tier - marked as coming soon. "
                   f"Remove 'coming_soon' flag from plan first.",
        )

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
    
    # If plan_id is being updated, check if new plan is coming_soon
    patch_data = body.model_dump(exclude_unset=True)
    if "plan_id" in patch_data:
        plan_result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == patch_data["plan_id"])
        )
        new_plan = plan_result.scalar_one_or_none()
        if new_plan is None:
            raise HTTPException(status_code=404, detail="Plan not found")
        if new_plan.coming_soon:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot assign '{new_plan.tier}' tier - marked as coming soon. "
                       f"Remove 'coming_soon' flag from plan first.",
            )
    
    for field, value in patch_data.items():
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
    from_date: datetime | None = Query(None, alias="from"),
    to_date: datetime | None = Query(None, alias="to"),
    db: AsyncSession = Depends(get_db_session),
    _admin_check: None = Depends(require_admin_api_key),
) -> List[BillingRecordOut]:
    """
    List subscription billing records with optional filters.
    Requires ADMIN_API_KEY header.
    
    Query parameters:
    - professional_id: Filter by professional UUID
    - from: Filter records paid on or after this date (ISO 8601)
    - to: Filter records paid on or before this date (ISO 8601)
    """
    q = select(SubscriptionBillingRecord).order_by(SubscriptionBillingRecord.paid_at.desc())
    
    if professional_id:
        try:
            prof_uuid = uuid.UUID(professional_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid professional_id UUID")
        q = q.where(SubscriptionBillingRecord.professional_id == prof_uuid)
    
    if from_date:
        q = q.where(SubscriptionBillingRecord.paid_at >= from_date)
    
    if to_date:
        q = q.where(SubscriptionBillingRecord.paid_at <= to_date)
    
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
