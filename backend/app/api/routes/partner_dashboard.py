from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, case, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.models.booking import Booking, BookingPayment, BookingQuestionTemplate
from app.models.classes import ClassEnrollment, ClassSession, GroupClass
from app.models.client import ExpertClient, ExpertClientFollowUp, ExpertLead
from app.models.holistic_team import HolisticTeamMember
from app.models.professional import Professional, ProfessionalReview
from app.models.user import User
from app.models.verification import CredentialVerification, ProfessionalIdentityVerification
from app.schemas.partner_dashboard import (
    PartnerActiveClientOut,
    PartnerDashboardMetricsOut,
    PartnerDashboardOut,
    PartnerDashboardOverviewOut,
    PartnerDashboardRecentReviewOut,
    PartnerFollowUpOut,
    TodayActivityOut,
    TodaySessionOut,
)

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("/me/dashboard", response_model=PartnerDashboardOut)
async def get_partner_dashboard(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> PartnerDashboardOut:
    user_result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authenticated user not found")

    if user.user_type != "partner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only partner users can access this endpoint")

    professional_result = await db.execute(
        select(Professional)
        .options(
            selectinload(Professional.services),
            selectinload(Professional.availability_slots),
            selectinload(Professional.languages),
            selectinload(Professional.certifications),
        )
        .where(Professional.user_id == current_user.user_id)
    )
    professional = professional_result.scalar_one_or_none()

    if professional is None:
        return PartnerDashboardOut(
            overview=PartnerDashboardOverviewOut(),
            metrics=PartnerDashboardMetricsOut(),
            recent_reviews=[],
        )

    booking_questions_result = await db.execute(
        select(func.count(BookingQuestionTemplate.id)).where(
            BookingQuestionTemplate.professional_id == current_user.user_id,
            BookingQuestionTemplate.is_active.is_(True),
        )
    )
    booking_questions_total = int(booking_questions_result.scalar_one() or 0)

    now_utc = datetime.now(timezone.utc)
    bookings_result = await db.execute(
        select(
            func.count(Booking.id),
            func.sum(case((Booking.scheduled_for >= now_utc, 1), else_=0)),
            func.sum(case((Booking.is_immediate.is_(True), 1), else_=0)),
            func.sum(case((Booking.status == "confirmed", 1), else_=0)),
        ).where(Booking.professional_id == current_user.user_id)
    )
    (
        bookings_total,
        upcoming_bookings_total,
        immediate_bookings_total,
        completed_bookings_total,
    ) = bookings_result.one()

    revenue_result = await db.execute(
        select(
            func.coalesce(func.sum(BookingPayment.amount), Decimal("0")),
            func.max(BookingPayment.currency),
        )
        .select_from(BookingPayment)
        .join(Booking, Booking.id == BookingPayment.booking_id)
        .where(
            Booking.professional_id == current_user.user_id,
            BookingPayment.status == "success",
        )
    )
    revenue_total_raw, revenue_currency = revenue_result.one()

    teams_result = await db.execute(
        select(func.count(distinct(HolisticTeamMember.team_id))).where(
            HolisticTeamMember.professional_id == current_user.user_id
        )
    )
    holistic_teams_total = int(teams_result.scalar_one() or 0)

    # Count upcoming published group sessions
    sessions_result = await db.execute(
        select(func.count(ClassSession.id))
        .join(GroupClass, GroupClass.id == ClassSession.group_class_id)
        .where(
            GroupClass.professional_id == current_user.user_id,
            ClassSession.status == "published",
            ClassSession.session_date >= now_utc.date(),
        )
    )
    upcoming_sessions_total = int(sessions_result.scalar_one() or 0)

    reviews_result = await db.execute(
        select(ProfessionalReview)
        .options(selectinload(ProfessionalReview.reviewer))
        .where(ProfessionalReview.professional_id == current_user.user_id)
        .order_by(ProfessionalReview.created_at.desc(), ProfessionalReview.id.desc())
        .limit(5)
    )
    recent_reviews_rows = reviews_result.scalars().all()

    # ------------------------------------------------------------------
    # Active clients & follow-ups — derived from the bookings ledger.
    # ------------------------------------------------------------------
    clients_result = await db.execute(
        select(
            Booking.client_user_id,
            Booking.scheduled_for,
            User.full_name,
        )
        .join(User, User.id == Booking.client_user_id)
        .where(
            Booking.professional_id == current_user.user_id,
            Booking.client_user_id.is_not(None),
        )
        .order_by(Booking.scheduled_for)
    )
    clients_rows = clients_result.all()

    # Aggregate per-client last/next session timestamps.
    from collections import defaultdict  # noqa: PLC0415

    client_data: dict[str, dict] = {}
    for row in clients_rows:
        uid = str(row.client_user_id)
        if uid not in client_data:
            client_data[uid] = {"name": row.full_name or "Client", "last": None, "next": None}
        if row.scheduled_for is not None:
            if row.scheduled_for < now_utc:
                if client_data[uid]["last"] is None or row.scheduled_for > client_data[uid]["last"]:
                    client_data[uid]["last"] = row.scheduled_for
            else:
                if client_data[uid]["next"] is None or row.scheduled_for < client_data[uid]["next"]:
                    client_data[uid]["next"] = row.scheduled_for

    def _initials(name: str) -> str:
        parts = name.strip().split()
        return "".join(p[0].upper() for p in parts[:2]) or "??"

    active_clients = [
        PartnerActiveClientOut(
            client_user_id=uid,
            name=data["name"],
            initials=_initials(data["name"]),
            last_session_at=data["last"],
            next_session_at=data["next"],
            status="active",
        )
        for uid, data in client_data.items()
    ][:20]

    # ------------------------------------------------------------------
    # Follow-ups — combine auto-generated + manual follow-ups
    # ------------------------------------------------------------------
    # 1. Auto-generated: clients with last session but no next session
    auto_followups = [
        PartnerFollowUpOut(
            id=f"auto_{c.client_user_id}",
            client_user_id=c.client_user_id,
            name=c.name,
            initials=c.initials,
            last_session_at=c.last_session_at,
            reason="Check in after last session",
            is_manual=False,
        )
        for c in active_clients
        if c.next_session_at is None and c.last_session_at is not None
    ]

    # 2. Manual follow-ups: explicitly created by professional (unresolved only)
    manual_followups_result = await db.execute(
        select(ExpertClientFollowUp, ExpertClient)
        .join(ExpertClient, ExpertClient.id == ExpertClientFollowUp.client_id)
        .where(
            ExpertClientFollowUp.professional_id == current_user.user_id,
            ExpertClientFollowUp.resolved == False,  # noqa: E712
        )
        .order_by(ExpertClientFollowUp.due_date.asc())
    )
    manual_followups_rows = manual_followups_result.all()

    manual_followups = []
    for followup, client in manual_followups_rows:
        is_overdue = followup.due_date < now_utc
        manual_followups.append(
            PartnerFollowUpOut(
                id=f"manual_{followup.id}",
                client_user_id=str(client.user_id) if client.user_id else f"client_{client.id}",
                name=client.name,
                initials=_initials(client.name),
                last_session_at=client.last_session_date,
                reason=followup.note[:100] if followup.note else "Follow-up due",
                due_date=followup.due_date,
                note=followup.note,
                is_overdue=is_overdue,
                is_manual=True,
            )
        )

    # Combine: prioritize overdue manual follow-ups first, then due manual, then auto
    overdue_manual = [f for f in manual_followups if f.is_overdue]
    due_manual = [f for f in manual_followups if not f.is_overdue]
    follow_ups = (overdue_manual + due_manual + auto_followups)[:10]

    # ------------------------------------------------------------------
    # Today's sessions — bookings scheduled today OR immediate created today.
    # ------------------------------------------------------------------
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    today_result = await db.execute(
        select(
            Booking.booking_reference,
            Booking.service_name,
            Booking.scheduled_for,
            Booking.is_immediate,
            Booking.status,
            Booking.created_at,
            User.full_name,
        )
        .outerjoin(User, User.id == Booking.client_user_id)
        .where(
            Booking.professional_id == current_user.user_id,
            Booking.status != "cancelled",
            or_(
                and_(
                    Booking.scheduled_for >= today_start,
                    Booking.scheduled_for < tomorrow_start,
                ),
                and_(
                    Booking.is_immediate.is_(True),
                    Booking.created_at >= today_start,
                    Booking.created_at < tomorrow_start,
                ),
            ),
        )
        .order_by(Booking.scheduled_for.asc().nullslast(), Booking.created_at.asc())
        .limit(20)
    )
    today_rows = today_result.all()

    def _map_status(db_status: str) -> str:
        if db_status in ("pending", "confirmed"):
            return "upcoming"
        return db_status

    today_sessions = [
        TodaySessionOut(
            booking_reference=row.booking_reference,
            client_name=row.full_name or "Client",
            client_initials=_initials(row.full_name or "Client"),
            service_name=row.service_name,
            scheduled_at=row.scheduled_for,
            is_immediate=row.is_immediate,
            status=_map_status(row.status),
        )
        for row in today_rows
    ]

    return PartnerDashboardOut(
        overview=PartnerDashboardOverviewOut(
            membership_tier=professional.membership_tier,
            specialization=professional.specialization,
            location=professional.location,
            languages_total=len(professional.languages or []),
            certifications_total=len(professional.certifications or []),
        ),
        metrics=PartnerDashboardMetricsOut(
            services_total=len(professional.services or []),
            active_services_total=len([service for service in (professional.services or []) if service.is_active]),
            availability_slots_total=len(professional.availability_slots or []),
            booking_questions_total=booking_questions_total,
            bookings_total=int(bookings_total or 0),
            upcoming_bookings_total=int(upcoming_bookings_total or 0),
            immediate_bookings_total=int(immediate_bookings_total or 0),
            completed_bookings_total=int(completed_bookings_total or 0),
            holistic_teams_total=holistic_teams_total,
            revenue_total=float(revenue_total_raw or 0),
            revenue_currency=revenue_currency,
            rating_avg=float(professional.rating_avg or 0),
            rating_count=int(professional.rating_count or 0),
            upcoming_sessions_total=upcoming_sessions_total,
        ),
        recent_reviews=[
            PartnerDashboardRecentReviewOut(
                id=review.id,
                reviewer_name=(review.reviewer.full_name or "Anonymous") if review.reviewer else "Anonymous",
                rating=review.rating,
                comment=review.review_text,
                created_at=review.created_at,
            )
            for review in recent_reviews_rows
        ],
        active_clients=active_clients,
        follow_ups=follow_ups,
        today_sessions=today_sessions,
    )


@router.get("/me/today-activity", response_model=list[TodayActivityOut])
async def get_today_activity(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[TodayActivityOut]:
    """
    Fetch all activities that happened TODAY for this professional.
    Returns unified timeline of bookings, reviews, enrollments, clients, leads, and verifications.
    """
    user_result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authenticated user not found")

    if user.user_type != "partner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only partner users can access this endpoint")

    professional_result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.user_id)
    )
    professional = professional_result.scalar_one_or_none()
    if professional is None:
        return []

    # Define today's time range (UTC)
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    activities: list[TodayActivityOut] = []

    # 1. NEW BOOKINGS RECEIVED TODAY (not scheduled today, but created today)
    bookings_result = await db.execute(
        select(Booking, User)
        .join(User, User.id == Booking.client_user_id)
        .where(
            Booking.professional_id == current_user.user_id,
            Booking.created_at >= today_start,
            Booking.created_at < tomorrow_start,
        )
        .order_by(Booking.created_at.desc())
        .limit(10)
    )
    for booking, client in bookings_result.all():
        client_name = client.full_name or "Client"
        scheduled_time = ""
        if booking.scheduled_for:
            scheduled_time = f" • {booking.scheduled_for.strftime('%I:%M %p')}"
        elif booking.is_immediate:
            scheduled_time = " • Immediate session"
        
        activities.append(TodayActivityOut(
            id=f"booking_{booking.id}",
            activity_type="booking_received",
            timestamp=booking.created_at,
            icon="📅",
            title=f"New booking from {client_name}",
            description=f"{booking.service_name}{scheduled_time}",
            action_url="/v2/partner/body-expert",
            priority="high",
            metadata={
                "booking_reference": booking.booking_reference,
                "client_name": client_name,
                "service_name": booking.service_name,
            }
        ))

    # 2. NEW REVIEWS POSTED TODAY
    reviews_result = await db.execute(
        select(ProfessionalReview, User)
        .join(User, User.id == ProfessionalReview.reviewer_user_id)
        .where(
            ProfessionalReview.professional_id == current_user.user_id,
            ProfessionalReview.created_at >= today_start,
            ProfessionalReview.created_at < tomorrow_start,
        )
        .order_by(ProfessionalReview.created_at.desc())
        .limit(10)
    )
    for review, reviewer in reviews_result.all():
        reviewer_name = reviewer.full_name or "Anonymous"
        stars = "⭐" * review.rating
        preview = review.review_text[:80] + "..." if review.review_text and len(review.review_text) > 80 else review.review_text or stars
        
        activities.append(TodayActivityOut(
            id=f"review_{review.id}",
            activity_type="review_received",
            timestamp=review.created_at,
            icon="⭐",
            title=f"{reviewer_name} left a {review.rating}-star review",
            description=preview,
            action_url="/v2/partner/body-expert",
            priority="high",
            metadata={
                "reviewer_name": reviewer_name,
                "rating": review.rating,
                "review_text": review.review_text,
            }
        ))

    # 3. NEW CLASS ENROLLMENTS TODAY
    enrollments_result = await db.execute(
        select(ClassEnrollment, ClassSession, GroupClass)
        .join(ClassSession, ClassSession.id == ClassEnrollment.class_session_id)
        .join(GroupClass, GroupClass.id == ClassSession.group_class_id)
        .where(
            GroupClass.professional_id == current_user.user_id,
            ClassEnrollment.created_at >= today_start,
            ClassEnrollment.created_at < tomorrow_start,
        )
        .order_by(ClassEnrollment.created_at.desc())
        .limit(10)
    )
    for enrollment, session, group_class in enrollments_result.all():
        session_date = session.session_date.strftime("%b %d")
        if session.start_time:
            session_date += f" at {session.start_time.strftime('%I:%M %p')}"
        
        activities.append(TodayActivityOut(
            id=f"enrollment_{enrollment.id}",
            activity_type="enrollment_received",
            timestamp=enrollment.created_at,
            icon="✅",
            title=f"{enrollment.client_name} enrolled in {group_class.title}",
            description=f"Session on {session_date}",
            action_url="/v2/partner/body-expert/classes",
            priority="high",
            metadata={
                "client_name": enrollment.client_name,
                "class_title": group_class.title,
                "session_date": session_date,
            }
        ))

    # 4. NEW CLIENTS ADDED TODAY
    clients_result = await db.execute(
        select(ExpertClient)
        .where(
            ExpertClient.professional_id == current_user.user_id,
            ExpertClient.created_at >= today_start,
            ExpertClient.created_at < tomorrow_start,
        )
        .order_by(ExpertClient.created_at.desc())
        .limit(10)
    )
    for client in clients_result.scalars().all():
        source = client.acquisition_source or "Unknown"
        
        activities.append(TodayActivityOut(
            id=f"client_{client.id}",
            activity_type="client_added",
            timestamp=client.created_at,
            icon="👤",
            title=f"New client: {client.name}",
            description=f"Added via {source}",
            action_url="/v2/partner/body-expert/clients",
            priority="normal",
            metadata={
                "client_name": client.name,
                "source": source,
                "email": client.email,
            }
        ))

    # 5. NEW LEADS RECEIVED TODAY
    leads_result = await db.execute(
        select(ExpertLead)
        .where(
            ExpertLead.professional_id == current_user.user_id,
            ExpertLead.created_at >= today_start,
            ExpertLead.created_at < tomorrow_start,
        )
        .order_by(ExpertLead.created_at.desc())
        .limit(10)
    )
    for lead in leads_result.scalars().all():
        source = lead.source or "Direct"
        interest = lead.interest or "General inquiry"
        
        activities.append(TodayActivityOut(
            id=f"lead_{lead.id}",
            activity_type="lead_received",
            timestamp=lead.created_at,
            icon="🎯",
            title=f"New lead: {lead.name}",
            description=f"{interest} • via {source}",
            action_url="/v2/partner/body-expert/clients",
            priority="normal",
            metadata={
                "lead_name": lead.name,
                "source": source,
                "interest": interest,
            }
        ))

    # 6. VERIFICATION UPDATES TODAY (identity + credentials)
    # Identity verification
    identity_result = await db.execute(
        select(ProfessionalIdentityVerification)
        .where(
            ProfessionalIdentityVerification.user_id == current_user.user_id,
            ProfessionalIdentityVerification.updated_at >= today_start,
            ProfessionalIdentityVerification.updated_at < tomorrow_start,
            ProfessionalIdentityVerification.verification_status.in_(["approved", "rejected"]),
        )
        .order_by(ProfessionalIdentityVerification.updated_at.desc())
    )
    for verification in identity_result.scalars().all():
        if verification.verification_status == "approved":
            activities.append(TodayActivityOut(
                id=f"identity_verification_{verification.user_id}",
                activity_type="verification_update",
                timestamp=verification.updated_at,
                icon="✅",
                title="Identity verified!",
                description="Your identity documents have been approved",
                action_url="/v2/partner/body-expert/settings",
                priority="high",
                metadata={
                    "verification_type": "identity",
                    "status": "approved",
                }
            ))
        else:
            activities.append(TodayActivityOut(
                id=f"identity_verification_{verification.user_id}",
                activity_type="verification_update",
                timestamp=verification.updated_at,
                icon="⚠️",
                title="Identity verification issue",
                description=verification.rejection_reason or "Please review your documents",
                action_url="/v2/partner/body-expert/settings",
                priority="high",
                metadata={
                    "verification_type": "identity",
                    "status": "rejected",
                    "reason": verification.rejection_reason,
                }
            ))

    # Credential verifications
    credentials_result = await db.execute(
        select(CredentialVerification)
        .where(
            CredentialVerification.professional_id == current_user.user_id,
            CredentialVerification.updated_at >= today_start,
            CredentialVerification.updated_at < tomorrow_start,
            CredentialVerification.verification_status.in_(["approved", "rejected"]),
        )
        .order_by(CredentialVerification.updated_at.desc())
    )
    for credential in credentials_result.scalars().all():
        cred_name = f"{credential.credential_type} - {credential.credential_subtype}" if credential.credential_subtype else credential.credential_type
        if credential.verification_status == "approved":
            activities.append(TodayActivityOut(
                id=f"credential_{credential.id}",
                activity_type="verification_update",
                timestamp=credential.updated_at,
                icon="✅",
                title=f"{cred_name} verified!",
                description="Your credential has been approved",
                action_url="/v2/partner/body-expert/settings",
                priority="high",
                metadata={
                    "verification_type": "credential",
                    "credential_name": cred_name,
                    "status": "approved",
                }
            ))
        else:
            activities.append(TodayActivityOut(
                id=f"credential_{credential.id}",
                activity_type="verification_update",
                timestamp=credential.updated_at,
                icon="⚠️",
                title=f"{cred_name} verification issue",
                description=credential.rejection_reason or "Please review your credential",
                action_url="/v2/partner/body-expert/settings",
                priority="high",
                metadata={
                    "verification_type": "credential",
                    "credential_name": cred_name,
                    "status": "rejected",
                    "reason": credential.rejection_reason,
                }
            ))

    # Sort activities: high priority first, then by timestamp descending
    def sort_key(activity: TodayActivityOut):
        priority_order = {"high": 0, "normal": 1, "low": 2}
        return (priority_order.get(activity.priority, 1), -activity.timestamp.timestamp())
    
    activities.sort(key=sort_key)
    
    # Limit to 20 most relevant activities
    return activities[:20]
