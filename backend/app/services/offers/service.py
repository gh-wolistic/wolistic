from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.offer import Offer, OfferAssignment
from app.models.professional import Professional
from app.models.subscription import ProfessionalSubscription, SubscriptionPlan
from app.services.notification import create_notification


async def create_offer(
    db: AsyncSession,
    *,
    code: str,
    name: str,
    offer_type: str,
    domain: str,
    valid_from: datetime,
    valid_until: datetime | None,
    created_by: uuid.UUID | None,
    description: str | None = None,
    target_tier: str | None = None,
    duration_months: int | None = None,
    auto_downgrade_after_months: int | None = None,
    downgrade_to_tier: str | None = None,
    max_redemptions: int | None = None,
    is_active: bool = True,
) -> Offer:
    offer = Offer(
        code=code.upper().strip(),
        name=name.strip(),
        description=description,
        offer_type=offer_type,
        domain=domain,
        target_tier=target_tier,
        duration_months=duration_months,
        auto_downgrade_after_months=auto_downgrade_after_months,
        downgrade_to_tier=downgrade_to_tier,
        max_redemptions=max_redemptions,
        valid_from=valid_from,
        valid_until=valid_until,
        created_by=created_by,
        is_active=is_active,
    )
    db.add(offer)
    await db.flush()
    await db.refresh(offer)
    return offer


async def get_offer_usage_summary(db: AsyncSession, offer_id: int) -> dict:
    counts = await db.execute(
        select(OfferAssignment.status, func.count())
        .where(OfferAssignment.offer_id == offer_id)
        .group_by(OfferAssignment.status)
    )

    by_status = {status: int(count) for status, count in counts.all()}
    total = sum(by_status.values())

    return {
        "assigned": total,
        "pending": by_status.get("pending", 0),
        "active": by_status.get("active", 0),
        "redeemed": by_status.get("redeemed", 0),
        "expired": by_status.get("expired", 0),
        "revoked": by_status.get("revoked", 0),
    }


async def list_offers(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Offer).order_by(Offer.created_at.desc()))
    offers = list(result.scalars().all())

    payload: list[dict] = []
    for offer in offers:
        usage = await get_offer_usage_summary(db, offer.id)
        payload.append(
            {
                "id": offer.id,
                "code": offer.code,
                "name": offer.name,
                "description": offer.description,
                "offer_type": offer.offer_type,
                "domain": offer.domain,
                "target_tier": offer.target_tier,
                "duration_months": offer.duration_months,
                "auto_downgrade_after_months": offer.auto_downgrade_after_months,
                "downgrade_to_tier": offer.downgrade_to_tier,
                "max_redemptions": offer.max_redemptions,
                "valid_from": offer.valid_from.isoformat(),
                "valid_until": offer.valid_until.isoformat() if offer.valid_until else None,
                "is_active": offer.is_active,
                "usage": usage,
            }
        )

    return payload


async def assign_offer_to_professional(
    db: AsyncSession,
    *,
    offer: Offer,
    professional_id: uuid.UUID,
    assigned_by: uuid.UUID | None,
    notes: str | None,
) -> OfferAssignment:
    if offer.max_redemptions is not None:
        usage = await get_offer_usage_summary(db, offer.id)
        if usage["assigned"] >= offer.max_redemptions:
            raise ValueError(f"Offer {offer.code} reached max redemptions")

    expires_at = offer.valid_until
    assignment = OfferAssignment(
        offer_id=offer.id,
        professional_id=professional_id,
        assigned_by=assigned_by,
        status="pending",
        assigned_at=datetime.now(timezone.utc),
        expires_at=expires_at,
        notes=notes,
    )
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


async def _resolve_plan_id_for_tier(db: AsyncSession, tier: str) -> int:
    plan_result = await db.execute(
        select(SubscriptionPlan)
        .where(
            SubscriptionPlan.tier == tier,
            SubscriptionPlan.is_active.is_(True),
        )
        .order_by(SubscriptionPlan.expert_type.asc(), SubscriptionPlan.display_order.asc())
        .limit(1)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise ValueError(f"No active subscription plan found for tier '{tier}'")
    return int(plan.id)


async def activate_offer_assignment(
    db: AsyncSession,
    *,
    assignment: OfferAssignment,
    tier: str,
    duration_months: int,
) -> ProfessionalSubscription:
    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(days=max(duration_months, 1) * 30)

    offer_result = await db.execute(select(Offer).where(Offer.id == assignment.offer_id))
    offer = offer_result.scalar_one()

    auto_downgrade_at = None
    if offer.auto_downgrade_after_months:
        auto_downgrade_at = now + timedelta(days=offer.auto_downgrade_after_months * 30)

    plan_id = await _resolve_plan_id_for_tier(db, tier)

    existing_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.professional_id == assignment.professional_id
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.plan_id = plan_id
        existing.status = "active"
        existing.starts_at = now
        existing.ends_at = ends_at
        existing.auto_renew = False
        existing.subscription_type = "offer_redemption"
        existing.offer_assignment_id = assignment.id
        existing.auto_downgrade_at = auto_downgrade_at
        existing.auto_downgrade_to_tier = offer.downgrade_to_tier
        subscription = existing
    else:
        subscription = ProfessionalSubscription(
            professional_id=assignment.professional_id,
            plan_id=plan_id,
            status="active",
            starts_at=now,
            ends_at=ends_at,
            auto_renew=False,
            subscription_type="offer_redemption",
            offer_assignment_id=assignment.id,
            auto_downgrade_at=auto_downgrade_at,
            auto_downgrade_to_tier=offer.downgrade_to_tier,
        )
        db.add(subscription)

    assignment.status = "active"
    assignment.activated_at = now
    assignment.redeemed_at = now

    prof_result = await db.execute(
        select(Professional).where(Professional.user_id == assignment.professional_id)
    )
    professional = prof_result.scalar_one_or_none()
    if professional and tier:
        professional.membership_tier = tier

    await db.flush()
    return subscription


async def reconcile_expired_assignments(db: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(OfferAssignment).where(
            OfferAssignment.status.in_(["pending", "active"]),
            OfferAssignment.expires_at.is_not(None),
            OfferAssignment.expires_at < now,
        )
    )
    assignments = list(result.scalars().all())

    for assignment in assignments:
        assignment.status = "expired"

    await db.flush()
    return len(assignments)


async def run_auto_downgrade_job(db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)

    due_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.subscription_type == "offer_redemption",
            ProfessionalSubscription.auto_downgrade_at.is_not(None),
            ProfessionalSubscription.auto_downgrade_at <= now,
            ProfessionalSubscription.status == "active",
        )
    )
    due_subscriptions = list(due_result.scalars().all())

    downgraded = 0
    notifications_sent = 0

    for sub in due_subscriptions:
        target_tier = sub.auto_downgrade_to_tier or "free"

        plan_id = await _resolve_plan_id_for_tier(db, target_tier)
        sub.plan_id = plan_id
        sub.subscription_type = "admin_upgrade"
        sub.offer_assignment_id = None
        sub.auto_downgrade_at = None
        sub.auto_downgrade_to_tier = None

        prof_result = await db.execute(
            select(Professional).where(Professional.user_id == sub.professional_id)
        )
        professional = prof_result.scalar_one_or_none()
        if professional:
            professional.membership_tier = target_tier

        downgraded += 1

        await create_notification(
            db,
            user_id=sub.professional_id,
            type="system",
            title="Offer period ended",
            description=f"Your promotional period has ended and your tier has moved to {target_tier}.",
            action_url="/subscription",
            action_text="View subscription",
            extra_data={"source": "offer_auto_downgrade", "target_tier": target_tier},
        )
        notifications_sent += 1

    # Grace-period notifications for upcoming downgrades in next 7 days
    grace_until = now + timedelta(days=7)
    upcoming_result = await db.execute(
        select(ProfessionalSubscription).where(
            ProfessionalSubscription.subscription_type == "offer_redemption",
            ProfessionalSubscription.auto_downgrade_at.is_not(None),
            ProfessionalSubscription.auto_downgrade_at > now,
            ProfessionalSubscription.auto_downgrade_at <= grace_until,
            ProfessionalSubscription.status == "active",
        )
    )
    upcoming_subscriptions = list(upcoming_result.scalars().all())

    for sub in upcoming_subscriptions:
        await create_notification(
            db,
            user_id=sub.professional_id,
            type="system",
            title="Offer ending soon",
            description="Your promotional tier ends in less than 7 days. Renew to keep premium access.",
            action_url="/subscription",
            action_text="Renew now",
            extra_data={"source": "offer_grace_period", "auto_downgrade_at": sub.auto_downgrade_at.isoformat() if sub.auto_downgrade_at else None},
        )
        notifications_sent += 1

    expired_assignments = await reconcile_expired_assignments(db)

    await db.flush()
    return {
        "downgraded": downgraded,
        "grace_notifications": len(upcoming_subscriptions),
        "notifications_sent": notifications_sent,
        "expired_assignments": expired_assignments,
    }
