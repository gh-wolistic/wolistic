from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_admin_api_key
from app.core.audit import log_admin_action
from app.core.config import get_settings
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.models.coin import CoinRule
from app.models.offer import Offer, OfferAssignment
from app.models.subscription import ProfessionalSubscription
from app.services.coins import award_coins
from app.services.offers import (
    activate_offer_assignment,
    assign_offer_to_professional,
    create_offer,
    list_offers,
    run_auto_downgrade_job,
)

settings = get_settings()

# Persistent session store that survives backend restarts
SESSION_FILE = Path("/tmp/wolistic_admin_sessions.json")
SESSION_EXPIRY_DAYS = 7


def _load_sessions() -> dict[str, dict]:
    """Load sessions from disk. Returns {session_id: {email, expires_at}}"""
    if not SESSION_FILE.exists():
        return {}
    try:
        with open(SESSION_FILE, "r") as f:
            sessions = json.load(f)
        # Clean up expired sessions
        now = datetime.now(timezone.utc)
        active = {
            sid: data
            for sid, data in sessions.items()
            if datetime.fromisoformat(data["expires_at"]) > now
        }
        if len(active) != len(sessions):
            _save_sessions(active)  # Save cleaned sessions
        return active
    except (json.JSONDecodeError, KeyError, ValueError):
        return {}


def _save_sessions(sessions: dict[str, dict]) -> None:
    """Save sessions to disk."""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SESSION_FILE, "w") as f:
        json.dump(sessions, f)


# Load sessions on startup (survives hot reload)
_active_sessions: dict[str, dict] = _load_sessions()


# ============================================================================
# Session-Based Authentication Dependency
# ============================================================================

def require_admin_session(admin_session: str | None = Cookie(default=None)) -> str:
    """
    Dependency to require valid admin session.
    Returns admin email if authenticated, raises 401 otherwise.
    """
    if not admin_session or admin_session not in _active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - please login",
        )
    
    # Check if session is expired
    session_data = _active_sessions[admin_session]
    expires_at = datetime.fromisoformat(session_data["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        # Clean up expired session
        del _active_sessions[admin_session]
        _save_sessions(_active_sessions)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired - please login again",
        )
    
    return session_data["email"]


# ============================================================================
# Routers
# ============================================================================

# Session-based auth router (for login/logout/session check)
auth_router = APIRouter(prefix="/admin", tags=["admin-auth"])

# Admin data router (protected by API key)
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin_api_key)],  # Use API key for data endpoints
)

AdminProfessionalStatus = Literal["pending", "verified", "suspended"]
AdminMembershipTier = Literal["free", "pro", "elite", "celeb"]


# ============================================================================
# Session-Based Authentication Endpoints
# ============================================================================


class AdminLoginRequest(BaseModel):
    email: str
    password: str


@auth_router.post("/login")
async def admin_login(payload: AdminLoginRequest, response: Response) -> dict:
    """
    Admin login endpoint with session cookie authentication.
    For development: accepts any password for configured admin email.
    """
    # Get admin email from environment (ADMIN_EMAIL or hardcoded fallback)
    admin_email = getattr(settings, "ADMIN_EMAIL", "admin@wolistic.com")
    
    # Validate credentials (development mode - simple check)
    if payload.email.lower() != admin_email.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )
    
    # TODO: Add proper password validation in production
    # For now, accept any non-empty password for development
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )
    
    # Create session with expiry
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    _active_sessions[session_id] = {
        "email": payload.email,
        "expires_at": expires_at.isoformat(),
    }
    _save_sessions(_active_sessions)
    
    # Set secure cookie (7 days)
    response.set_cookie(
        key="admin_session",
        value=session_id,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=SESSION_EXPIRY_DAYS * 86400,  # 7 days
        domain=None,  # Allow cookies to work across localhost variations
    )
    
    return {
        "authenticated": True,
        "email": payload.email,
    }


@auth_router.get("/session")
async def check_admin_session(admin_session: str | None = Cookie(default=None)) -> dict:
    """Check if admin session is valid."""
    if not admin_session or admin_session not in _active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    # Check expiry
    session_data = _active_sessions[admin_session]
    expires_at = datetime.fromisoformat(session_data["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        del _active_sessions[admin_session]
        _save_sessions(_active_sessions)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )
    
    return {
        "authenticated": True,
        "email": session_data["email"],
    }


@auth_router.post("/logout")
async def admin_logout(response: Response, admin_session: str | None = Cookie(default=None)) -> dict:
    """Logout admin user."""
    if admin_session and admin_session in _active_sessions:
        del _active_sessions[admin_session]
        _save_sessions(_active_sessions)
    
    # Clear cookie
    response.delete_cookie(key="admin_session")
    
    return {"status": "logged_out"}


# ============================================================================
# Analytics & Metrics Endpoints (Session Protected)
# ============================================================================

@router.get("/metrics/overview")
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db_session)) -> dict:
    """Get overview metrics for admin dashboard."""
    # Count total professionals
    prof_count_query = select(func.count()).select_from(User).where(User.user_type == "partner")
    total_professionals = (await db.execute(prof_count_query)).scalar_one()
    
    # Count pending professionals
    pending_query = select(func.count()).select_from(User).where(
        User.user_type == "partner",
        func.coalesce(User.user_status, "pending") == "pending"
    )
    pending_verifications = (await db.execute(pending_query)).scalar_one()
    
    # Count active subscriptions
    active_subs_query = select(func.count()).select_from(ProfessionalSubscription).where(
        ProfessionalSubscription.status == "active"
    )
    active_subscriptions = (await db.execute(active_subs_query)).scalar_one()
    
    # Count total users
    user_count_query = select(func.count()).select_from(User)
    total_users = (await db.execute(user_count_query)).scalar_one()
    
    # Total coins circulated (sum of all wallet balances)
    from app.models.coin import CoinWallet
    coins_query = select(func.coalesce(func.sum(CoinWallet.balance), 0)).select_from(CoinWallet)
    total_coins_circulated = (await db.execute(coins_query)).scalar_one()
    
    # Count professionals by tier - treat NULL as "free"
    tier_query = select(
        Professional.membership_tier,
        func.count().label("count")
    ).select_from(User).join(
        Professional, User.id == Professional.user_id, isouter=True
    ).where(
        User.user_type == "partner"
    ).group_by(
        Professional.membership_tier
    )
    tier_results = (await db.execute(tier_query)).all()
    
    professionals_by_tier = {"free": 0, "pro": 0, "elite": 0, "celeb": 0}
    for tier, count in tier_results:
        tier_key = tier if tier else "free"  # Handle NULL as "free"
        if tier_key in professionals_by_tier:
            professionals_by_tier[tier_key] = count
    
    # Total revenue (placeholder for now - implement when billing records exist)
    revenue_total = 0
    revenue_monthly = 0
    
    return {
        "total_professionals": total_professionals,
        "pending_verifications": pending_verifications,
        "active_subscriptions": active_subscriptions,
        "total_users": total_users,
        "total_coins_circulated": total_coins_circulated,
        "revenue_total": revenue_total,
        "revenue_monthly": revenue_monthly,
        "professionals_by_tier": professionals_by_tier,
    }


@router.get("/metrics/registrations")
async def get_registration_trend(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    """Get registration trend data."""
    from datetime import timedelta
    
    # Calculate start date
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Query registrations grouped by date and user type
    query = select(
        func.date(User.created_at).label("date"),
        User.user_type.label("type"),
        func.count().label("count")
    ).where(
        User.created_at >= start_date
    ).group_by(
        func.date(User.created_at),
        User.user_type
    ).order_by(
        func.date(User.created_at)
    )
    
    results = (await db.execute(query)).all()
    
    return [
        {
            "date": row.date.isoformat(),
            "type": row.type,
            "count": row.count
        }
        for row in results
    ]


@router.get("/metrics/revenue")
async def get_revenue_trend(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    """Get revenue trend data."""
    # Placeholder - implement when billing records exist
    # For now, return mock data based on subscriptions
    from datetime import timedelta
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Query active subscriptions by tier
    query = select(
        func.date(ProfessionalSubscription.created_at).label("date"),
        func.coalesce(Professional.membership_tier, "free").label("tier"),
        func.count().label("count")
    ).select_from(ProfessionalSubscription).join(
        Professional, ProfessionalSubscription.professional_id == Professional.user_id
    ).where(
        ProfessionalSubscription.created_at >= start_date,
        ProfessionalSubscription.status == "active"
    ).group_by(
        func.date(ProfessionalSubscription.created_at),
        Professional.membership_tier  # PostgreSQL requires the base column in GROUP BY
    ).order_by(
        func.date(ProfessionalSubscription.created_at)
    )
    
    results = (await db.execute(query)).all()
    
    # Convert to revenue (tier prices)
    tier_prices = {"free": 0, "pro": 999, "elite": 2499, "celeb": 9999}
    
    return [
        {
            "date": row.date.isoformat(),
            "tier": row.tier,
            "amount": tier_prices.get(row.tier, 0) * row.count
        }
        for row in results
    ]


# ============================================================================
# Coin Analytics Endpoints (Session Protected)
# ============================================================================

@router.get("/coins/analytics")
async def get_coin_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get coin economy analytics."""
    from app.models.coin import CoinWallet, CoinTransaction
    
    # Total circulating (sum of all wallet balances)
    circulating_query = select(func.coalesce(func.sum(CoinWallet.balance), 0))
    total_circulating = (await db.execute(circulating_query)).scalar_one()
    
    # Active wallets (wallets with balance > 0)
    active_wallets_query = select(func.count()).select_from(CoinWallet).where(
        CoinWallet.balance > 0
    )
    active_wallets = (await db.execute(active_wallets_query)).scalar_one()
    
    # Calculate date range for trends
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Total earned in period (positive transactions)
    earned_query = select(func.coalesce(func.sum(CoinTransaction.amount), 0)).where(
        CoinTransaction.amount > 0,
        CoinTransaction.created_at >= start_date
    )
    total_earned = (await db.execute(earned_query)).scalar_one()
    
    # Total spent in period (negative transactions)
    spent_query = select(func.coalesce(func.sum(func.abs(CoinTransaction.amount)), 0)).where(
        CoinTransaction.amount < 0,
        CoinTransaction.created_at >= start_date
    )
    total_spent = (await db.execute(spent_query)).scalar_one()
    
    # Calculate previous period for comparison
    prev_start = start_date - timedelta(days=days)
    prev_end = start_date
    
    # Previous period earned
    prev_earned_query = select(func.coalesce(func.sum(CoinTransaction.amount), 0)).where(
        CoinTransaction.amount > 0,
        CoinTransaction.created_at >= prev_start,
        CoinTransaction.created_at < prev_end
    )
    prev_earned = (await db.execute(prev_earned_query)).scalar_one()
    
    # Previous period spent
    prev_spent_query = select(func.coalesce(func.sum(func.abs(CoinTransaction.amount)), 0)).where(
        CoinTransaction.amount < 0,
        CoinTransaction.created_at >= prev_start,
        CoinTransaction.created_at < prev_end
    )
    prev_spent = (await db.execute(prev_spent_query)).scalar_one()
    
    # Calculate percentage changes
    earned_change = ((total_earned - prev_earned) / prev_earned * 100) if prev_earned > 0 else 0
    spent_change = ((total_spent - prev_spent) / prev_spent * 100) if prev_spent > 0 else 0
    
    return {
        "total_circulating": total_circulating,
        "active_wallets": active_wallets,
        "total_earned_30d": total_earned,
        "total_spent_30d": total_spent,
        "earned_change_percent": round(earned_change, 1),
        "spent_change_percent": round(spent_change, 1),
    }


@router.get("/coins/top-events")
async def get_top_coin_events(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    """Get top coin earning/spending events."""
    from app.models.coin import CoinTransaction
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Group by event type and sum amounts
    query = select(
        CoinTransaction.event_type.label("event"),
        func.count().label("count"),
        func.sum(CoinTransaction.amount).label("total_coins")
    ).where(
        CoinTransaction.created_at >= start_date,
        CoinTransaction.event_type.isnot(None)
    ).group_by(
        CoinTransaction.event_type
    ).order_by(
        func.sum(CoinTransaction.amount).desc()
    ).limit(limit)
    
    results = (await db.execute(query)).all()
    
    return [
        {
            "event": row.event,
            "count": row.count,
            "total_coins": row.total_coins
        }
        for row in results
    ]


# ============================================================================
# Professional Management Endpoints (Session Protected)
# ============================================================================


class BulkApproveProfessionalsRequest(BaseModel):
    user_ids: list[uuid.UUID] = Field(..., alias="userIds", min_length=1)
    min_profile_completeness: int = Field(default=90, alias="minProfileCompleteness", ge=0, le=100)


class OfferCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    offer_type: Literal["tier_upgrade", "tier_discount", "service_discount"] = "tier_upgrade"
    domain: Literal["subscription", "booking"] = "subscription"
    target_tier: AdminMembershipTier | None = None
    duration_months: int | None = Field(default=None, ge=1, le=36)
    auto_downgrade_after_months: int | None = Field(default=None, ge=1, le=36)
    downgrade_to_tier: AdminMembershipTier | None = None
    max_redemptions: int | None = Field(default=None, ge=1)
    valid_from: datetime
    valid_until: datetime | None = None
    is_active: bool = True


class OfferAssignRequest(BaseModel):
    offer_code: str = Field(..., min_length=2, max_length=50)
    professional_id: uuid.UUID
    auto_activate: bool = True
    notes: str | None = Field(default=None, max_length=1000)


@router.get("/professionals")
async def list_professionals_for_admin(
    status_filter: AdminProfessionalStatus | Literal["all"] = Query(default="pending", alias="status"),
    tier_filter: AdminMembershipTier | Literal["all"] = Query(default="all", alias="tier"),
    search_query: str | None = Query(default=None, alias="search"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    filters = [User.user_type == "partner"]

    if status_filter != "all":
        filters.append(func.coalesce(User.user_status, "pending") == status_filter)
    
    # Tier filtering - treat NULL/missing Professional record as "free" tier
    if tier_filter != "all":
        filters.append(func.coalesce(Professional.membership_tier, "free") == tier_filter)
    
    # Search filtering (email or name)
    if search_query:
        search_pattern = f"%{search_query}%"
        filters.append(
            (User.email.ilike(search_pattern)) | (User.full_name.ilike(search_pattern))
        )

    count_query = (
        select(func.count())
        .select_from(User)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(*filters)
    )
    total_result = await db.execute(count_query)
    total = int(total_result.scalar_one() or 0)

    query = (
        select(User, Professional, ProfessionalSubscription)
        .outerjoin(Professional, Professional.user_id == User.id)
        .outerjoin(ProfessionalSubscription, ProfessionalSubscription.professional_id == User.id)
        .where(*filters)
        .order_by(User.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)

    items = []
    for user, professional, subscription in result.all():
        # If professional has paid tier (pro/elite/celeb) but no subscription record, it's admin-upgraded
        tier = professional.membership_tier if professional else None
        # Treat NULL/missing tier as "free" (default tier)
        display_tier = tier if tier else "free"
        is_admin_upgraded = tier in ("pro", "elite", "celeb") and subscription is None
        
        items.append(
            {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "user_type": user.user_type,
                "user_subtype": user.user_subtype,
                "user_status": user.user_status or "pending",
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "profile": {
                    "username": professional.username if professional else None,
                    "specialization": professional.specialization if professional else None,
                    "membership_tier": display_tier,  # Always return a tier, defaulting to "free"
                    "profile_completeness": professional.profile_completeness if professional else 0,
                    "location": professional.location if professional else None,
                    "has_profile": professional is not None,
                    "is_admin_upgraded": is_admin_upgraded,
                },
            }
        )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.get("/professionals/{user_id}")
async def get_professional_detail(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Get detailed information about a specific professional."""
    result = await db.execute(
        select(User, Professional)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(User.id == user_id, User.user_type == "partner")
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found",
        )
    
    user, professional = row
    
    return {
        "user_id": str(user.id),
        "email": user.email,
        "name": user.full_name or "N/A",
        "phone": None,  # User model doesn't have phone field
        "user_status": user.user_status or "pending",
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat() if user.updated_at else user.created_at.isoformat(),
        "membership_tier": professional.membership_tier if professional else "free",
        "profile_completeness": professional.profile_completeness if professional else 0,
        "bio": professional.about if professional else None,
        "username": professional.username if professional else None,
        "specialization": professional.specialization if professional else None,
        "location": professional.location if professional else None,
        "experience_years": professional.experience_years if professional else 0,
        "rating_avg": float(professional.rating_avg) if professional else 0.0,
        "rating_count": professional.rating_count if professional else 0,
        "services": [],  # TODO: Load from professional.services relationship
        "credentials": [],  # TODO: Load from certifications relationship
    }


@router.post("/professionals/{user_id}/status")
async def update_professional_status(
    user_id: uuid.UUID,
    new_status: AdminProfessionalStatus = Query(alias="status"),
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id, User.user_type == "partner"))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional user not found")

    user.user_status = new_status

    await db.commit()
    await db.refresh(user)

    # Award profile_verified coins when admin approves a partner.
    if new_status == "verified":
        await award_coins(
            db,
            user_id=user.id,
            event_type="profile_verified",
            reference_type="professional",
            reference_id=str(user.id),
        )
        await db.commit()

    # Audit log
    if request:
        await log_admin_action(
            action=f"update_professional_status_{new_status}",
            resource_type="professional",
            resource_id=str(user_id),
            admin_email=admin_email,
            request=request,
            db=db,
            payload={"new_status": new_status},
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "user_status": user.user_status,
        "updated_at": user.updated_at,
    }


@router.post("/professionals/{user_id}/approve")
async def approve_professional(
    user_id: uuid.UUID,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    return await update_professional_status(
        user_id=user_id,
        new_status="verified",
        admin_email=admin_email,
        request=request,
        db=db,
    )


@router.post("/professionals/{user_id}/suspend")
async def suspend_professional(
    user_id: uuid.UUID,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    return await update_professional_status(
        user_id=user_id,
        new_status="suspended",
        admin_email=admin_email,
        request=request,
        db=db,
    )


@router.post("/professionals/{user_id}/tier")
async def update_professional_tier(
    user_id: uuid.UUID,
    tier: AdminMembershipTier = Query(alias="tier"),
    duration_months: int = Query(default=1, ge=1, le=36, description="Subscription duration in months"),
    offer_code: str | None = Query(default=None, max_length=50, description="Promotion/offer code"),
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Update professional tier with subscription duration and offer tracking."""
    user_result = await db.execute(select(User).where(User.id == user_id, User.user_type == "partner"))
    user = user_result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional user not found")

    professional_result = await db.execute(select(Professional).where(Professional.user_id == user_id))
    professional = professional_result.scalar_one_or_none()

    if professional is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional profile not found")

    # Update professional tier
    professional.membership_tier = tier

    # If this tier change was tied to an offer, activate assignment and create/update subscription metadata.
    if tier != "free" and offer_code:
        offer_result = await db.execute(
            select(Offer).where(
                func.lower(Offer.code) == offer_code.strip().lower(),
                Offer.is_active.is_(True),
            )
        )
        offer = offer_result.scalar_one_or_none()
        if not offer:
            raise HTTPException(status_code=404, detail=f"Offer '{offer_code}' not found or inactive")

        assigned_by_id: uuid.UUID | None = None
        admin_user_result = await db.execute(select(User).where(func.lower(User.email) == admin_email.lower()))
        admin_user = admin_user_result.scalar_one_or_none()
        if admin_user:
            assigned_by_id = admin_user.id

        assignment = await assign_offer_to_professional(
            db,
            offer=offer,
            professional_id=user_id,
            assigned_by=assigned_by_id,
            notes=f"Tier upgrade from admin panel to {tier}",
        )
        await activate_offer_assignment(
            db,
            assignment=assignment,
            tier=tier,
            duration_months=duration_months,
        )
        
    await db.commit()
    await db.refresh(professional)

    # Audit log
    if request:
        await log_admin_action(
            action="update_professional_tier",
            resource_type="professional",
            resource_id=str(user_id),
            admin_email=admin_email,
            request=request,
            db=db,
            payload={
                "tier": tier,
                "duration_months": duration_months,
                "offer_code": offer_code,
            },
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "membership_tier": professional.membership_tier,
        "duration_months": duration_months,
        "offer_code": offer_code,
        "updated_at": professional.updated_at.isoformat(),
    }


@router.get("/offers")
async def admin_list_offers(db: AsyncSession = Depends(get_db_session)) -> list[dict]:
    """List all centralized offers with usage summary."""
    return await list_offers(db)


@router.post("/offers", status_code=status.HTTP_201_CREATED)
async def admin_create_offer(
    payload: OfferCreateRequest,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Create a centralized offer in the catalog."""
    existing = await db.execute(select(Offer).where(func.lower(Offer.code) == payload.code.strip().lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Offer code '{payload.code}' already exists")

    created_by: uuid.UUID | None = None
    admin_result = await db.execute(select(User).where(func.lower(User.email) == admin_email.lower()))
    admin_user = admin_result.scalar_one_or_none()
    if admin_user:
        created_by = admin_user.id

    offer = await create_offer(
        db,
        code=payload.code,
        name=payload.name,
        description=payload.description,
        offer_type=payload.offer_type,
        domain=payload.domain,
        target_tier=payload.target_tier,
        duration_months=payload.duration_months,
        auto_downgrade_after_months=payload.auto_downgrade_after_months,
        downgrade_to_tier=payload.downgrade_to_tier,
        max_redemptions=payload.max_redemptions,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
        created_by=created_by,
        is_active=payload.is_active,
    )
    await db.commit()
    await db.refresh(offer)

    # Audit log
    if request:
        await log_admin_action(
            action="create_offer",
            resource_type="offer",
            resource_id=str(offer.id),
            admin_email=admin_email,
            request=request,
            db=db,
            payload={
                "code": offer.code,
                "name": offer.name,
                "target_tier": offer.target_tier,
                "duration_months": offer.duration_months,
            },
        )

    return {
        "id": offer.id,
        "code": offer.code,
        "name": offer.name,
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
    }


@router.post("/offers/assign", status_code=status.HTTP_201_CREATED)
async def admin_assign_offer(
    payload: OfferAssignRequest,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Assign an offer to a professional and optionally auto-activate it."""
    offer_result = await db.execute(
        select(Offer).where(
            func.lower(Offer.code) == payload.offer_code.strip().lower(),
            Offer.is_active.is_(True),
        )
    )
    offer = offer_result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail=f"Offer '{payload.offer_code}' not found or inactive")

    professional_exists = await db.execute(
        select(Professional).where(Professional.user_id == payload.professional_id)
    )
    if not professional_exists.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Professional profile not found")

    admin_result = await db.execute(select(User).where(func.lower(User.email) == admin_email.lower()))
    admin_user = admin_result.scalar_one_or_none()

    try:
        assignment = await assign_offer_to_professional(
            db,
            offer=offer,
            professional_id=payload.professional_id,
            assigned_by=admin_user.id if admin_user else None,
            notes=payload.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if payload.auto_activate:
        target_tier = offer.target_tier or "pro"
        duration_months = offer.duration_months or 1
        await activate_offer_assignment(
            db,
            assignment=assignment,
            tier=target_tier,
            duration_months=duration_months,
        )

    await db.commit()
    await db.refresh(assignment)

    # Audit log
    if request:
        await log_admin_action(
            action="assign_offer",
            resource_type="offer_assignment",
            resource_id=str(assignment.id),
            admin_email=admin_email,
            request=request,
            db=db,
            payload={
                "offer_code": payload.offer_code,
                "professional_id": str(payload.professional_id),
                "auto_activate": payload.auto_activate,
                "notes": payload.notes,
            },
        )

    return {
        "id": assignment.id,
        "offer_id": assignment.offer_id,
        "professional_id": str(assignment.professional_id),
        "status": assignment.status,
        "assigned_at": assignment.assigned_at.isoformat(),
        "activated_at": assignment.activated_at.isoformat() if assignment.activated_at else None,
        "expires_at": assignment.expires_at.isoformat() if assignment.expires_at else None,
        "notes": assignment.notes,
    }


@router.get("/offers/assignments")
async def admin_list_offer_assignments(
    status_filter: str | None = Query(default=None, alias="status"),
    offer_code: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """List offer assignments with optional status and code filtering."""
    filters = []

    if status_filter:
        filters.append(OfferAssignment.status == status_filter)

    query = select(OfferAssignment, Offer).join(Offer, Offer.id == OfferAssignment.offer_id)
    if offer_code:
        query = query.where(func.lower(Offer.code) == offer_code.strip().lower())
    if filters:
        query = query.where(*filters)

    total_query = select(func.count()).select_from(query.subquery())
    total = int((await db.execute(total_query)).scalar_one() or 0)

    result = await db.execute(
        query
        .order_by(OfferAssignment.assigned_at.desc())
        .offset(offset)
        .limit(limit)
    )

    items = []
    for assignment, offer in result.all():
        items.append(
            {
                "id": assignment.id,
                "offer_code": offer.code,
                "offer_name": offer.name,
                "professional_id": str(assignment.professional_id),
                "status": assignment.status,
                "assigned_at": assignment.assigned_at.isoformat(),
                "activated_at": assignment.activated_at.isoformat() if assignment.activated_at else None,
                "expires_at": assignment.expires_at.isoformat() if assignment.expires_at else None,
                "notes": assignment.notes,
            }
        )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.post("/offers/maintenance/auto-downgrade")
async def admin_run_offer_maintenance(
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Run auto-downgrade and grace-period notification maintenance job."""
    report = await run_auto_downgrade_job(db)
    await db.commit()

    # Audit log
    if request:
        await log_admin_action(
            action="run_offer_maintenance",
            resource_type="offer_maintenance",
            resource_id="auto_downgrade_job",
            admin_email=admin_email,
            request=request,
            db=db,
            payload=report,
        )

    return {
        "status": "ok",
        "ran_at": datetime.now(timezone.utc).isoformat(),
        **report,
    }


@router.post("/professionals/bulk-approve")
async def bulk_approve_professionals(
    payload: BulkApproveProfessionalsRequest,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    unique_ids = list(dict.fromkeys(payload.user_ids))

    eligible_query = (
        select(User, Professional)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(
            User.id.in_(unique_ids),
            User.user_type == "partner",
            func.coalesce(User.user_status, "pending") == "pending",
            Professional.profile_completeness >= payload.min_profile_completeness,
        )
    )
    result = await db.execute(eligible_query)

    updated_ids: list[str] = []
    for user, _professional in result.all():
        user.user_status = "verified"
        updated_ids.append(str(user.id))

    await db.commit()

    # Award profile_verified coins for each newly approved partner.
    for uid_str in updated_ids:
        import uuid as _uuid
        await award_coins(
            db,
            user_id=_uuid.UUID(uid_str),
            event_type="profile_verified",
            reference_type="professional",
            reference_id=uid_str,
        )
    if updated_ids:
        await db.commit()

    # Audit log
    if request:
        await log_admin_action(
            action="bulk_approve_professionals",
            resource_type="professional",
            resource_id="bulk",
            admin_email=admin_email,
            request=request,
            db=db,
            payload={
                "requested": len(unique_ids),
                "approved": len(updated_ids),
                "min_profile_completeness": payload.min_profile_completeness,
                "updated_ids": updated_ids,
            },
        )

    return {
        "requested": len(unique_ids),
        "approved": len(updated_ids),
        "min_profile_completeness": payload.min_profile_completeness,
        "updated_ids": updated_ids,
    }


@router.get("/users/by-email")
async def get_user_id_by_email(
    email: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Resolve an email address to its user UUID. Used by admin coin lookup."""
    result = await db.execute(select(User).where(User.email == email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": str(user.id), "email": user.email}


# ============================================================================
# Coin Rules Management Endpoints (Session Protected)
# ============================================================================


class CoinRuleCreate(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=64)
    coins_awarded: int
    is_active: bool = True
    max_per_user: int | None = None
    cooldown_days: int | None = None
    description: str | None = None


class CoinRuleUpdate(BaseModel):
    coins_awarded: int | None = None
    is_active: bool | None = None
    max_per_user: int | None = None
    cooldown_days: int | None = None
    description: str | None = None


@router.get("/coins/rules")
async def list_coin_rules(db: AsyncSession = Depends(get_db_session)) -> list[dict]:
    """List all coin earning rules."""
    result = await db.execute(select(CoinRule).order_by(CoinRule.event_type))
    rules = result.scalars().all()
    
    return [
        {
            "event_type": r.event_type,
            "coins_awarded": r.coins_awarded,
            "is_active": r.is_active,
            "max_per_user": r.max_per_user,
            "cooldown_days": r.cooldown_days,
            "description": r.description,
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rules
    ]


@router.post("/coins/rules")
async def create_coin_rule(
    payload: CoinRuleCreate,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Create a new coin earning rule."""
    # Check if rule already exists
    existing = await db.execute(
        select(CoinRule).where(CoinRule.event_type == payload.event_type)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule for event_type '{payload.event_type}' already exists",
        )
    
    rule = CoinRule(
        event_type=payload.event_type,
        coins_awarded=payload.coins_awarded,
        is_active=payload.is_active,
        max_per_user=payload.max_per_user,
        cooldown_days=payload.cooldown_days,
        description=payload.description,
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    # Audit log
    if request:
        await log_admin_action(
            action="create_coin_rule",
            resource_type="coin_rule",
            resource_id=rule.event_type,
            admin_email=admin_email,
            request=request,
            db=db,
            payload={
                "event_type": rule.event_type,
                "coins_awarded": rule.coins_awarded,
                "is_active": rule.is_active,
            },
        )
    
    return {
        "event_type": rule.event_type,
        "coins_awarded": rule.coins_awarded,
        "is_active": rule.is_active,
        "max_per_user": rule.max_per_user,
        "cooldown_days": rule.cooldown_days,
        "description": rule.description,
        "updated_at": rule.updated_at.isoformat(),
    }


@router.patch("/coins/rules/{event_type}")
async def update_coin_rule(
    event_type: str,
    payload: CoinRuleUpdate,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Update an existing coin rule."""
    result = await db.execute(
        select(CoinRule).where(CoinRule.event_type == event_type)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule for event_type '{event_type}' not found",
        )
    
    # Track changes for audit log
    changes = {}
    
    # Update fields if provided
    if payload.coins_awarded is not None:
        changes["coins_awarded"] = {"old": rule.coins_awarded, "new": payload.coins_awarded}
        rule.coins_awarded = payload.coins_awarded
    if payload.is_active is not None:
        changes["is_active"] = {"old": rule.is_active, "new": payload.is_active}
        rule.is_active = payload.is_active
    if payload.max_per_user is not None:
        changes["max_per_user"] = {"old": rule.max_per_user, "new": payload.max_per_user}
        rule.max_per_user = payload.max_per_user
    if payload.cooldown_days is not None:
        changes["cooldown_days"] = {"old": rule.cooldown_days, "new": payload.cooldown_days}
        rule.cooldown_days = payload.cooldown_days
    if payload.description is not None:
        rule.description = payload.description
    
    await db.commit()
    await db.refresh(rule)

    # Audit log
    if request:
        await log_admin_action(
            action="update_coin_rule",
            resource_type="coin_rule",
            resource_id=event_type,
            admin_email=admin_email,
            request=request,
            db=db,
            payload=changes,
        )
    
    return {
        "event_type": rule.event_type,
        "coins_awarded": rule.coins_awarded,
        "is_active": rule.is_active,
        "max_per_user": rule.max_per_user,
        "cooldown_days": rule.cooldown_days,
        "description": rule.description,
        "updated_at": rule.updated_at.isoformat(),
    }


@router.delete("/coins/rules/{event_type}")
async def delete_coin_rule(
    event_type: str,
    admin_email: str = Depends(require_admin_session),
    request: Request = None,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """Delete a coin rule."""
    result = await db.execute(
        select(CoinRule).where(CoinRule.event_type == event_type)
    )
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule for event_type '{event_type}' not found",
        )
    
    await db.delete(rule)
    await db.commit()

    # Audit log
    if request:
        await log_admin_action(
            action="delete_coin_rule",
            resource_type="coin_rule",
            resource_id=event_type,
            admin_email=admin_email,
            request=request,
            db=db,
            payload={"event_type": event_type},
        )
    
    return {"status": "deleted", "event_type": event_type}


# ============================================================================
# Audit Logs
# ============================================================================

@router.get("/audit-logs")
async def list_audit_logs(
    admin_email_filter: str | None = Query(default=None, alias="admin_email"),
    resource_type_filter: str | None = Query(default=None, alias="resource_type"),
    action_filter: str | None = Query(default=None, alias="action"),
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    List audit logs with filtering and pagination.
    
    Supports filtering by:
    - admin_email: Filter by who performed the action
    - resource_type: Filter by type of resource (professional, offer, coin_rule, etc.)
    - action: Filter by action name
    - from_date: Filter by created_at >= this date
    - to_date: Filter by created_at <= this date
    
    Returns paginated results ordered by created_at DESC (newest first).
    """
    from app.models.admin_audit import AdminAuditLog
    
    # Build query with filters
    filters = []
    
    if admin_email_filter:
        filters.append(AdminAuditLog.admin_email == admin_email_filter)
    
    if resource_type_filter:
        filters.append(AdminAuditLog.resource_type == resource_type_filter)
    
    if action_filter:
        filters.append(AdminAuditLog.action == action_filter)
    
    if from_date:
        filters.append(AdminAuditLog.created_at >= from_date)
    
    if to_date:
        filters.append(AdminAuditLog.created_at <= to_date)
    
    # Count total matching logs
    count_query = select(func.count()).select_from(AdminAuditLog)
    if filters:
        count_query = count_query.where(*filters)
    
    total = (await db.execute(count_query)).scalar_one()
    
    # Get paginated logs
    query = select(AdminAuditLog)
    if filters:
        query = query.where(*filters)
    
    query = query.order_by(AdminAuditLog.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "items": [
            {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "admin_email": log.admin_email,
                "request_method": log.request_method,
                "request_path": log.request_path,
                "payload": log.payload,
                "client_ip": log.client_ip,
                "user_agent": log.user_agent,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/audit-logs/export")
async def export_audit_logs_csv(
    admin_email_filter: str | None = Query(default=None, alias="admin_email"),
    resource_type_filter: str | None = Query(default=None, alias="resource_type"),
    action_filter: str | None = Query(default=None, alias="action"),
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    db: AsyncSession = Depends(get_db_session),
) -> Response:
    """
    Export audit logs as CSV with same filtering as list endpoint.
    
    Returns CSV file with all matching audit logs (no pagination).
    Useful for compliance reports and forensics.
    """
    import csv
    import io
    from app.models.admin_audit import AdminAuditLog
    
    # Build query with filters (same as list endpoint)
    filters = []
    
    if admin_email_filter:
        filters.append(AdminAuditLog.admin_email == admin_email_filter)
    
    if resource_type_filter:
        filters.append(AdminAuditLog.resource_type == resource_type_filter)
    
    if action_filter:
        filters.append(AdminAuditLog.action == action_filter)
    
    if from_date:
        filters.append(AdminAuditLog.created_at >= from_date)
    
    if to_date:
        filters.append(AdminAuditLog.created_at <= to_date)
    
    # Get all matching logs (no limit for export)
    query = select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc())
    if filters:
        query = query.where(*filters)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID",
        "Timestamp",
        "Admin Email",
        "Action",
        "Resource Type",
        "Resource ID",
        "HTTP Method",
        "Request Path",
        "Client IP",
        "User Agent",
        "Payload (JSON)",
    ])
    
    # Write data rows
    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat(),
            log.admin_email,
            log.action,
            log.resource_type,
            log.resource_id,
            log.request_method,
            log.request_path,
            log.client_ip or "",
            log.user_agent or "",
            json.dumps(log.payload) if log.payload else "",
        ])
    
    # Return CSV as download
    csv_content = output.getvalue()
    output.close()
    
    filename = f"audit_logs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
