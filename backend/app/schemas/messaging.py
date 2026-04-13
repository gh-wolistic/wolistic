"""Pydantic schemas for messaging API."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── User Profile Schema (for messaging context) ───────────────────────────────


class UserProfileOut(BaseModel):
    """Minimal user profile for messaging participants."""

    user_id: uuid.UUID
    name: str
    email: str | None = None

    model_config = {"from_attributes": True}


# ── Message Schemas ───────────────────────────────────────────────────────────


class MessageIn(BaseModel):
    """Input schema for creating a new message."""

    content: str = Field(min_length=1, max_length=10000)


class MessageOut(BaseModel):
    """Output schema for a message."""

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    created_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Conversation Schemas ──────────────────────────────────────────────────────


class ConversationParticipantOut(BaseModel):
    """Output schema for conversation participant."""

    user_id: uuid.UUID
    joined_at: datetime
    last_read_at: datetime | None = None
    user_profile: UserProfileOut | None = None

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    """Output schema for a conversation."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime | None = None
    participants: list[ConversationParticipantOut]
    extra_metadata: dict | None = None

    model_config = {"from_attributes": True}


class ConversationWithLastMessageOut(BaseModel):
    """Output schema for conversation list with last message preview."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime | None = None
    participants: list[ConversationParticipantOut]
    last_message: MessageOut | None = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class ConversationCreateIn(BaseModel):
    """Input schema for creating a new conversation."""

    other_user_id: uuid.UUID = Field(description="The other user to start a conversation with")


# ── Unread Count Schema ───────────────────────────────────────────────────────


class UnreadCountOut(BaseModel):
    """Output schema for unread message count."""

    conversation_id: uuid.UUID
    unread_count: int
