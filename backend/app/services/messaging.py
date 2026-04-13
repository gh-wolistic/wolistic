"""Messaging service — business logic for conversations and messages with policy enforcement."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from sqlalchemy import and_, desc, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.client import ExpertClient
from app.models.messaging import Conversation, ConversationParticipant, Message
from app.models.professional import Professional
from app.models.user import User, UserFavourite

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Policy Validation
# ---------------------------------------------------------------------------


async def can_user_message_professional(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    professional_id: uuid.UUID,
) -> bool:
    """
    Check if user is allowed to initiate/participate in conversation with professional.
    
    Allowed if:
    - User has favorited the professional, OR
    - User has a booking (any status) with the professional, OR
    - Professional has user in their expert_clients table
    """
    # Check if user has favorited the professional
    has_favorited = await db.scalar(
        select(
            exists().where(
                and_(
                    UserFavourite.user_id == user_id,
                    UserFavourite.professional_id == professional_id,
                )
            )
        )
    )
    if has_favorited:
        return True

    # Check if user has any booking with the professional
    has_booking = await db.scalar(
        select(
            exists().where(
                and_(
                    Booking.client_user_id == user_id,
                    Booking.professional_id == professional_id,
                )
            )
        )
    )
    if has_booking:
        return True

    # Check if professional has user in their expert_clients
    is_expert_client = await db.scalar(
        select(
            exists().where(
                and_(
                    ExpertClient.professional_id == professional_id,
                    ExpertClient.user_id == user_id,
                )
            )
        )
    )
    if is_expert_client:
        return True

    return False


# ---------------------------------------------------------------------------
# Conversation Management
# ---------------------------------------------------------------------------


async def get_or_create_conversation(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    other_user_id: uuid.UUID,
    validate_policy: bool = True,
) -> Conversation | None:
    """
    Get existing conversation between two users or create a new one.
    
    If validate_policy is True, checks if user is allowed to message the other user
    (assumes other_user is a professional).
    
    Returns None if policy validation fails.
    """
    # Normalize order to ensure consistent conversation lookup
    participant_ids = sorted([user_id, other_user_id])

    # Try to find existing conversation
    result = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id.in_(participant_ids))
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id) == 2)
        .options(selectinload(Conversation.participants))
    )
    conversation = result.scalar_one_or_none()

    if conversation:
        return conversation

    # Validate policy before creating new conversation
    if validate_policy:
        # Check if other_user is a professional
        is_professional = await db.scalar(
            select(exists().where(Professional.user_id == other_user_id))
        )

        if is_professional:
            allowed = await can_user_message_professional(
                db, user_id=user_id, professional_id=other_user_id
            )
            if not allowed:
                logger.warning(
                    f"User {user_id} not allowed to message professional {other_user_id}: "
                    "no favorite, booking, or client relationship"
                )
                return None

    # Create new conversation
    conversation = Conversation()
    db.add(conversation)
    await db.flush()

    # Add both participants
    for uid in participant_ids:
        participant = ConversationParticipant(conversation_id=conversation.id, user_id=uid)
        db.add(participant)

    await db.flush()
    await db.refresh(conversation, attribute_names=["participants"])

    logger.info(f"Created conversation {conversation.id} between {user_id} and {other_user_id}")
    return conversation


async def get_user_conversations(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    limit: int = 50,
) -> list[Conversation]:
    """
    Get all conversations for a user, ordered by most recent message.
    """
    result = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id == user_id)
        .order_by(desc(Conversation.last_message_at), desc(Conversation.updated_at))
        .limit(limit)
        .options(selectinload(Conversation.participants))
    )
    return list(result.scalars().all())


async def get_user_conversations_with_profiles(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    limit: int = 50,
) -> list[Conversation]:
    """
    Get all conversations for a user with participant user profiles loaded.
    
    This eagerly loads user names and emails for all participants.
    """
    result = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(ConversationParticipant.user_id == user_id)
        .order_by(desc(Conversation.last_message_at), desc(Conversation.updated_at))
        .limit(limit)
        .options(
            selectinload(Conversation.participants).selectinload(ConversationParticipant.user)
        )
    )
    return list(result.scalars().all())


async def get_conversation_by_id(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Conversation | None:
    """
    Get a conversation by ID, ensuring the user is a participant.
    """
    result = await db.execute(
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
        .options(selectinload(Conversation.participants))
    )
    return result.scalar_one_or_none()


async def is_conversation_participant(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """Check if user is a participant in the conversation."""
    result = await db.scalar(
        select(
            exists().where(
                and_(
                    ConversationParticipant.conversation_id == conversation_id,
                    ConversationParticipant.user_id == user_id,
                )
            )
        )
    )
    return bool(result)


# ---------------------------------------------------------------------------
# Message Management
# ---------------------------------------------------------------------------


async def send_message(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
) -> Message | None:
    """
    Send a message in a conversation.
    
    Validates that sender is a participant before creating the message.
    """
    # Verify sender is a participant
    is_participant = await is_conversation_participant(
        db, conversation_id=conversation_id, user_id=sender_id
    )
    if not is_participant:
        logger.warning(
            f"User {sender_id} attempted to send message in conversation {conversation_id} "
            "but is not a participant"
        )
        return None

    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content.strip(),
    )
    db.add(message)
    await db.flush()

    # Update conversation last_message_at (handled by trigger in production, but set here for consistency)
    await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .with_for_update()
    )
    conversation = await db.get(Conversation, conversation_id)
    if conversation:
        conversation.last_message_at = message.created_at
        conversation.updated_at = message.created_at

    await db.refresh(message)
    logger.info(f"Message {message.id} sent in conversation {conversation_id} by {sender_id}")
    return message


async def get_conversation_messages(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    limit: int = 50,
    before_message_id: uuid.UUID | None = None,
) -> list[Message]:
    """
    Get messages from a conversation with pagination.
    
    Validates that user is a participant before returning messages.
    
    Args:
        conversation_id: The conversation ID
        user_id: The requesting user ID (must be participant)
        limit: Maximum number of messages to return (default 50)
        before_message_id: For pagination, get messages before this message ID
    """
    # Verify user is a participant
    is_participant = await is_conversation_participant(
        db, conversation_id=conversation_id, user_id=user_id
    )
    if not is_participant:
        logger.warning(
            f"User {user_id} attempted to read messages from conversation {conversation_id} "
            "but is not a participant"
        )
        return []

    # Build query
    query = (
        select(Message)
        .where(
            and_(
                Message.conversation_id == conversation_id,
                Message.deleted_at.is_(None),  # Exclude soft-deleted messages
            )
        )
        .order_by(desc(Message.created_at))
        .limit(limit)
    )

    # Apply cursor pagination if provided
    if before_message_id:
        before_message = await db.get(Message, before_message_id)
        if before_message:
            query = query.where(Message.created_at < before_message.created_at)

    result = await db.execute(query)
    messages = list(result.scalars().all())

    # Return in ascending order (oldest first) for display
    return list(reversed(messages))


async def mark_conversation_read(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """
    Update the user's last_read_at timestamp for a conversation.
    
    Returns True if successful, False if user is not a participant.
    """
    result = await db.execute(
        select(ConversationParticipant).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
    )
    participant = result.scalar_one_or_none()

    if not participant:
        return False

    participant.last_read_at = datetime.utcnow()
    await db.flush()
    return True


async def get_unread_count(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> int:
    """
    Get the count of unread messages for a user in a conversation.
    """
    # Get user's last_read_at timestamp
    result = await db.execute(
        select(ConversationParticipant.last_read_at).where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
        )
    )
    last_read_at = result.scalar_one_or_none()

    # Count messages after last_read_at
    query = select(func.count(Message.id)).where(
        and_(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,  # Exclude own messages
            Message.deleted_at.is_(None),
        )
    )

    if last_read_at:
        query = query.where(Message.created_at > last_read_at)

    count = await db.scalar(query)
    return count or 0


async def soft_delete_message(
    db: AsyncSession,
    *,
    message_id: uuid.UUID,
    user_id: uuid.UUID,
) -> bool:
    """
    Soft-delete a message (can only delete own messages).
    
    Returns True if successful, False if not authorized or message not found.
    """
    message = await db.get(Message, message_id)
    if not message or message.sender_id != user_id:
        return False

    message.deleted_at = datetime.utcnow()
    await db.flush()
    logger.info(f"Message {message_id} soft-deleted by {user_id}")
    return True
