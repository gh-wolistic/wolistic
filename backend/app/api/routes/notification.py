"""API routes for notification functionality."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.schemas.notification import (
    NotificationCreateIn,
    NotificationMarkReadIn,
    NotificationOut,
    UnreadCountOut,
)
from app.services import notification as notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ── Get Notifications ─────────────────────────────────────────────────────────


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    type_filter: str | None = Query(default=None, description="Filter by notification type"),
    unread_only: bool = Query(default=False, description="Only return unread notifications"),
    limit: int = Query(default=50, le=100, description="Maximum number of notifications to return"),
    offset: int = Query(default=0, description="Offset for pagination"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[NotificationOut]:
    """
    Get notifications for the current user.
    
    Supports filtering by type, unread status, and pagination.
    """
    notifications = await notification_service.get_user_notifications(
        db,
        user_id=current_user.user_id,
        type_filter=type_filter,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    
    return [NotificationOut.model_validate(n) for n in notifications]


@router.get("/unread-count", response_model=UnreadCountOut)
async def get_unread_count(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UnreadCountOut:
    """
    Get unread notification count for the current user, overall and by type.
    """
    count_data = await notification_service.get_unread_count(
        db,
        user_id=current_user.user_id,
    )
    
    return UnreadCountOut(
        unread_count=count_data['total'],
        by_type=count_data['by_type'],
    )


# ── Mark as Read ──────────────────────────────────────────────────────────────


@router.post("/mark-read", status_code=status.HTTP_200_OK)
async def mark_notifications_read(
    payload: NotificationMarkReadIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, int]:
    """
    Mark notification(s) as read.
    
    If notification_ids is provided, marks only those notifications.
    If notification_ids is None/empty, marks all unread notifications as read.
    """
    count = await notification_service.mark_notifications_as_read(
        db,
        user_id=current_user.user_id,
        notification_ids=payload.notification_ids,
    )
    
    await db.commit()
    
    return {"marked_read": count}


# ── Delete Notification ───────────────────────────────────────────────────────


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """
    Delete a notification.
    
    User must own the notification.
    """
    deleted = await notification_service.delete_notification(
        db,
        notification_id=notification_id,
        user_id=current_user.user_id,
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or you don't have permission to delete it",
        )
    
    await db.commit()
    return {"status": "deleted"}


# ── Create Notification (Admin/System) ────────────────────────────────────────


@router.post("", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    payload: NotificationCreateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> NotificationOut:
    """
    Create a new notification (admin/system use).
    
    This endpoint is typically used by the system to create notifications for users.
    In production, you may want to restrict this to admin users only.
    """
    notification = await notification_service.create_notification(
        db,
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        action_url=payload.action_url,
        action_text=payload.action_text,
        extra_data=payload.extra_data,
    )
    
    await db.commit()
    await db.refresh(notification)
    
    return NotificationOut.model_validate(notification)
