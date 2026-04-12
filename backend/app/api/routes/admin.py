from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_admin_api_key
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User
from app.services.coins import award_coins

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin_api_key)])

AdminProfessionalStatus = Literal["pending", "verified", "suspended"]
AdminMembershipTier = Literal["basic", "premium", "elite"]


class BulkApproveProfessionalsRequest(BaseModel):
    user_ids: list[uuid.UUID] = Field(..., alias="userIds", min_length=1)
    min_profile_completeness: int = Field(default=90, alias="minProfileCompleteness", ge=0, le=100)


@router.get("/professionals")
async def list_professionals_for_admin(
    status_filter: AdminProfessionalStatus | Literal["all"] = Query(default="pending", alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    filters = [User.user_type == "partner"]

    if status_filter != "all":
        filters.append(func.coalesce(User.user_status, "pending") == status_filter)

    count_query = (
        select(func.count())
        .select_from(User)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(*filters)
    )
    total_result = await db.execute(count_query)
    total = int(total_result.scalar_one() or 0)

    query = (
        select(User, Professional)
        .outerjoin(Professional, Professional.user_id == User.id)
        .where(*filters)
        .order_by(User.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)

    items = []
    for user, professional in result.all():
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
                    "membership_tier": professional.membership_tier if professional else None,
                    "profile_completeness": professional.profile_completeness if professional else 0,
                    "location": professional.location if professional else None,
                    "has_profile": professional is not None,
                },
            }
        )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.post("/professionals/{user_id}/status")
async def update_professional_status(
    user_id: uuid.UUID,
    new_status: AdminProfessionalStatus = Query(alias="status"),
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

    return {
        "id": str(user.id),
        "email": user.email,
        "user_status": user.user_status,
        "updated_at": user.updated_at,
    }


@router.post("/professionals/{user_id}/approve")
async def approve_professional(user_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)) -> dict:
    return await update_professional_status(user_id=user_id, new_status="verified", db=db)


@router.post("/professionals/{user_id}/suspend")
async def suspend_professional(user_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)) -> dict:
    return await update_professional_status(user_id=user_id, new_status="suspended", db=db)


@router.post("/professionals/{user_id}/tier")
async def update_professional_tier(
    user_id: uuid.UUID,
    tier: AdminMembershipTier = Query(alias="tier"),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    user_result = await db.execute(select(User).where(User.id == user_id, User.user_type == "partner"))
    user = user_result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional user not found")

    professional_result = await db.execute(select(Professional).where(Professional.user_id == user_id))
    professional = professional_result.scalar_one_or_none()

    if professional is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professional profile not found")

    professional.membership_tier = tier

    await db.commit()
    await db.refresh(professional)

    return {
        "id": str(user.id),
        "email": user.email,
        "membership_tier": professional.membership_tier,
        "updated_at": professional.updated_at,
    }


@router.post("/professionals/bulk-approve")
async def bulk_approve_professionals(
    payload: BulkApproveProfessionalsRequest,
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
