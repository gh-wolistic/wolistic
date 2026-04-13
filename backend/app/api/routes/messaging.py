"""API routes for messaging functionality."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.database import get_db_session
from app.schemas.messaging import (
    ConversationCreateIn,
    ConversationOut,
    ConversationParticipantOut,
    ConversationWithLastMessageOut,
    MessageIn,
    MessageOut,
    UnreadCountOut,
    UserProfileOut,
)
from app.services import messaging as messaging_service

router = APIRouter(prefix="/messaging", tags=["messaging"])


# ── Conversations ─────────────────────────────────────────────────────────────


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreateIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationOut:
    """
    Create or get existing conversation with another user.
    
    Validates that the current user is allowed to message the other user
    (checks for favorite, booking, or client relationship if other user is a professional).
    """
    conversation = await messaging_service.get_or_create_conversation(
        db,
        user_id=current_user.user_id,
        other_user_id=payload.other_user_id,
        validate_policy=True,
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to message this user. "
            "Please favorite them or book a session first.",
        )

    await db.commit()
    return ConversationOut.model_validate(conversation)


@router.get("/conversations", response_model=list[ConversationWithLastMessageOut])
async def list_conversations(
    limit: int = Query(default=50, le=100, description="Maximum number of conversations to return"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[ConversationWithLastMessageOut]:
    """
    List all conversations for the current user, ordered by most recent message.
    
    Includes last message preview and unread count for each conversation.
    """
    conversations = await messaging_service.get_user_conversations_with_profiles(
        db,
        user_id=current_user.user_id,
        limit=limit,
    )

    result = []
    for conv in conversations:
        # Get last message
        messages = await messaging_service.get_conversation_messages(
            db,
            conversation_id=conv.id,
            user_id=current_user.user_id,
            limit=1,
        )
        last_message = messages[0] if messages else None

        # Get unread count
        unread_count = await messaging_service.get_unread_count(
            db,
            conversation_id=conv.id,
            user_id=current_user.user_id,
        )

        # Build participants with user profiles
        participants_out = []
        for participant in conv.participants:
            user_profile = None
            if hasattr(participant, 'user') and participant.user:
                user_profile = UserProfileOut(
                    user_id=participant.user.id,
                    name=participant.user.full_name or participant.user.email or "Unknown",
                    email=participant.user.email,
                )
            
            participants_out.append(
                ConversationParticipantOut(
                    user_id=participant.user_id,
                    joined_at=participant.joined_at,
                    last_read_at=participant.last_read_at,
                    user_profile=user_profile,
                )
            )

        result.append(
            ConversationWithLastMessageOut(
                id=conv.id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                last_message_at=conv.last_message_at,
                participants=participants_out,
                last_message=MessageOut.model_validate(last_message) if last_message else None,
                unread_count=unread_count,
            )
        )

    return result


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationOut:
    """Get a specific conversation by ID (user must be a participant)."""
    conversation = await messaging_service.get_conversation_by_id(
        db,
        conversation_id=conversation_id,
        user_id=current_user.user_id,
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or you are not a participant",
        )

    return ConversationOut.model_validate(conversation)


# ── Messages ──────────────────────────────────────────────────────────────────


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: uuid.UUID,
    payload: MessageIn,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MessageOut:
    """
    Send a message in a conversation.
    
    User must be a participant in the conversation.
    """
    message = await messaging_service.send_message(
        db,
        conversation_id=conversation_id,
        sender_id=current_user.user_id,
        content=payload.content,
    )

    if not message:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation",
        )

    await db.commit()
    return MessageOut.model_validate(message)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: uuid.UUID,
    before_message_id: uuid.UUID | None = None,
    limit: int = 50,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[MessageOut]:
    """
    Get messages from a conversation with pagination.
    
    Returns messages in ascending order (oldest first).
    Use before_message_id for cursor-based pagination.
    """
    if limit > 100:
        limit = 100  # Cap at 100 messages per request

    messages = await messaging_service.get_conversation_messages(
        db,
        conversation_id=conversation_id,
        user_id=current_user.user_id,
        limit=limit,
        before_message_id=before_message_id,
    )

    return [MessageOut.model_validate(msg) for msg in messages]


@router.post("/conversations/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_conversation_read(
    conversation_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Mark all messages in a conversation as read.
    
    Updates the user's last_read_at timestamp to the current time.
    """
    success = await messaging_service.mark_conversation_read(
        db,
        conversation_id=conversation_id,
        user_id=current_user.user_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or you are not a participant",
        )

    await db.commit()


@router.get("/conversations/{conversation_id}/unread", response_model=UnreadCountOut)
async def get_unread_count(
    conversation_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UnreadCountOut:
    """Get the count of unread messages in a conversation."""
    # Verify user is a participant
    is_participant = await messaging_service.is_conversation_participant(
        db,
        conversation_id=conversation_id,
        user_id=current_user.user_id,
    )

    if not is_participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or you are not a participant",
        )

    count = await messaging_service.get_unread_count(
        db,
        conversation_id=conversation_id,
        user_id=current_user.user_id,
    )

    return UnreadCountOut(conversation_id=conversation_id, unread_count=count)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Soft-delete a message (can only delete your own messages).
    """
    success = await messaging_service.soft_delete_message(
        db,
        message_id=message_id,
        user_id=current_user.user_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or you are not authorized to delete it",
        )

    await db.commit()
