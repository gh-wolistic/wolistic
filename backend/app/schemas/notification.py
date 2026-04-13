"""Pydantic schemas for notifications API."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    """Output schema for a notification."""

    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    description: str
    read: bool
    action_url: str | None = None
    action_text: str | None = None
    extra_data: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreateIn(BaseModel):
    """Input schema for creating a notification (admin/system use)."""

    user_id: uuid.UUID
    type: str = Field(
        description="Notification type: message, lead, schedule, followup, system"
    )
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    action_url: str | None = Field(default=None, max_length=512)
    action_text: str | None = Field(default=None, max_length=100)
    extra_data: dict | None = None


class NotificationMarkReadIn(BaseModel):
    """Input schema for marking notification(s) as read."""

    notification_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="List of specific notification IDs to mark as read. If None, marks all as read.",
    )


class UnreadCountOut(BaseModel):
    """Output schema for unread notification count."""

    unread_count: int
    by_type: dict[str, int] = Field(
        description="Count of unread notifications grouped by type"
    )
