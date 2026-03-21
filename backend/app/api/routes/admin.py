from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_admin_api_key
from app.core.database import get_db_session
from app.models.professional import Professional
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin_api_key)])

AdminProfessionalStatus = Literal["pending", "verified", "suspended"]


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
                    "rating": float(professional.rating_avg) if professional and professional.rating_avg is not None else 0,
                    "review_count": professional.rating_count if professional else 0,
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
