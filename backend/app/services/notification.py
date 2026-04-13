"""Notification service — business logic for managing user notifications."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from sqlalchemy import and_, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    type: str,
    title: str,
    description: str,
    action_url: str | None = None,
    action_text: str | None = None,
    extra_data: dict | None = None,
) -> Notification:
    """
    Create a new notification for a user.
    
    Args:
        db: Database session
        user_id: Target user ID
        type: Notification type (message, lead, schedule, followup, system)
        title: Notification title
        description: Notification description
        action_url: Optional action URL
        action_text: Optional action button text
        extra_data: Optional additional data (avatar, sender_id, etc.)
    
    Returns:
        Created notification
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        description=description,
        action_url=action_url,
        action_text=action_text,
        extra_data=extra_data,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    
    logger.info(f"Created notification {notification.id} for user {user_id} (type: {type})")
    return notification


async def get_user_notifications(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    type_filter: str | None = None,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Notification]:
    """
    Get notifications for a user with optional filtering.
    
    Args:
        db: Database session
        user_id: User ID
        type_filter: Optional filter by notification type
        unread_only: If True, only return unread notifications
        limit: Maximum number of notifications to return
        offset: Offset for pagination
    
    Returns:
        List of notifications
    """
    filters = [Notification.user_id == user_id]
    
    if type_filter:
        filters.append(Notification.type == type_filter)
    
    if unread_only:
        filters.append(Notification.read == False)
    
    result = await db.execute(
        select(Notification)
        .where(and_(*filters))
        .order_by(desc(Notification.created_at))
        .limit(limit)
        .offset(offset)
    )
    
    return list(result.scalars().all())


async def mark_notifications_as_read(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    notification_ids: list[uuid.UUID] | None = None,
) -> int:
    """
    Mark notification(s) as read.
    
    Args:
        db: Database session
        user_id: User ID (for security check)
        notification_ids: Optional list of specific notification IDs. If None, marks all as read.
    
    Returns:
        Number of notifications marked as read
    """
    filters = [
        Notification.user_id == user_id,
        Notification.read == False,
    ]
    
    if notification_ids:
        filters.append(Notification.id.in_(notification_ids))
    
    result = await db.execute(
        update(Notification)
        .where(and_(*filters))
        .values(read=True, updated_at=datetime.utcnow())
    )
    
    count = result.rowcount or 0
    logger.info(f"Marked {count} notifications as read for user {user_id}")
    return count


async def delete_notification(
    db: AsyncSession,
    *,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """
    Delete a notification (user must own it).
    
    Args:
        db: Database session
        notification_id: Notification ID
        user_id: User ID (for security check)
    
    Returns:
        True if deleted, False if not found or not owned by user
    """
    result = await db.execute(
        select(Notification)
        .where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        return False
    
    await db.delete(notification)
    logger.info(f"Deleted notification {notification_id} for user {user_id}")
    return True


async def get_unread_count(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
) -> dict[str, int]:
    """
    Get unread notification count overall and grouped by type.
    
    Args:
        db: Database session
        user_id: User ID
    
    Returns:
        Dict with 'total' count and counts by type
    """
    # Get total unread count
    total_result = await db.execute(
        select(func.count(Notification.id))
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.read == False,
            )
        )
    )
    total_count = total_result.scalar() or 0
    
    # Get unread count by type
    type_result = await db.execute(
        select(
            Notification.type,
            func.count(Notification.id).label('count')
        )
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.read == False,
            )
        )
        .group_by(Notification.type)
    )
    
    by_type = {row[0]: row[1] for row in type_result.all()}
    
    return {
        'total': total_count,
        'by_type': by_type,
    }
