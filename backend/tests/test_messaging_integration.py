"""
Integration test for messaging - actually hits the database to verify end-to-end flow.

Run with: docker-compose exec backend pytest tests/test_messaging_integration.py -v
"""

import os
import uuid

import pytest
from httpx import AsyncClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.config import get_settings

get_settings.cache_clear()

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.main import app
from app.models.booking import Booking
from app.models.messaging import (
    Conversation,
    ConversationParticipant,
    Message,
)
from app.models.professional import Professional
from app.models.user import User, UserFavourite


@pytest.fixture(scope="function")
async def db_session():
    """Get a database session for setup/teardown."""
    async for session in get_db_session():
        yield session


@pytest.fixture
async def setup_users(db_session: AsyncSession):
    """Create test users with random UUIDs."""
    from sqlalchemy import text
    
    # Generate unique test user IDs for each test run
    client_user_id = uuid.uuid4()
    professional_user_id = uuid.uuid4()
    
    # Clean up any stale test data from previous runs (based on email pattern)
    await db_session.execute(text("""
        DELETE FROM messages WHERE conversation_id IN (
            SELECT c.id FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            JOIN users u ON cp.user_id = u.id
            WHERE u.email LIKE '%@test.com'
        )
    """))
    await db_session.execute(text("""
        DELETE FROM conversation_participants WHERE user_id IN (
            SELECT id FROM users WHERE email LIKE '%@test.com'
        )
    """))
    await db_session.execute(text("""
        DELETE FROM conversations WHERE id IN (
            SELECT conversation_id FROM conversation_participants WHERE user_id IN (
                SELECT id FROM users WHERE email LIKE '%@test.com'
            )
        )
    """))
    await db_session.execute(text("DELETE FROM user_favourites WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com') OR professional_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')"))
    await db_session.execute(text("DELETE FROM bookings WHERE client_user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com') OR professional_id IN (SELECT user_id FROM professionals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'))"))
    await db_session.execute(text("DELETE FROM professionals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')"))
    await db_session.execute(text("DELETE FROM users WHERE email LIKE '%@test.com'"))
    await db_session.commit()
    
    # Create client user
    client = User(
        id=client_user_id,
        email=f"client-{client_user_id}@test.com",
        full_name="Test Client",
        user_type="client",
        user_status="verified",
    )
    db_session.add(client)

    # Create professional user
    professional_user = User(
        id=professional_user_id,
        email=f"professional-{professional_user_id}@test.com",
        full_name="Test Professional",
        user_type="partner",
        user_subtype="diet_expert",
        user_status="verified",
    )
    db_session.add(professional_user)

    # Create professional profile
    professional = Professional(
        user_id=professional_user_id,
        username=f"test-professional-{professional_user_id}",
        specialization="Nutrition",
    )
    db_session.add(professional)

    await db_session.commit()
    return {
        "client": client, 
        "professional": professional,
        "client_user_id": client_user_id,
        "professional_user_id": professional_user_id
    }


def mock_auth_header(user_id: uuid.UUID) -> dict:
    """Create mock authorization header (backend validates via dependency)."""
    return {"Authorization": f"Bearer mock-token-{user_id}"}


@pytest.mark.anyio
async def test_full_messaging_flow(db_session: AsyncSession, setup_users):
    """
    Test the complete messaging flow:
    1. Create favorite relationship
    2. Create conversation
    3. Send messages
    4. Retrieve messages
    5. Mark as read
    """
    # Extract user IDs from fixture
    CLIENT_USER_ID = setup_users["client_user_id"]
    PROFESSIONAL_USER_ID = setup_users["professional_user_id"]
    
    # 1. Setup: Create favorite relationship
    favorite = UserFavourite(
        user_id=CLIENT_USER_ID,
        professional_id=PROFESSIONAL_USER_ID,
    )
    db_session.add(favorite)
    await db_session.commit()

    # Since we can't override auth in integration tests easily,
    # let's directly test the service layer instead
    from app.services import messaging as messaging_service

    # 2. Create conversation
    conversation = await messaging_service.get_or_create_conversation(
        db_session,
        user_id=CLIENT_USER_ID,
        other_user_id=PROFESSIONAL_USER_ID,
        validate_policy=True,
    )

    assert conversation is not None
    assert conversation.id is not None
    assert len(conversation.participants) == 2

    # 3. Send message from client
    message1 = await messaging_service.send_message(
        db_session,
        conversation_id=conversation.id,
        sender_id=CLIENT_USER_ID,
        content="Hello! I have a question about nutrition.",
    )

    assert message1 is not None
    assert message1.content == "Hello! I have a question about nutrition."
    assert message1.sender_id == CLIENT_USER_ID
    await db_session.commit()

    # 4. Send reply from professional
    message2 = await messaging_service.send_message(
        db_session,
        conversation_id=conversation.id,
        sender_id=PROFESSIONAL_USER_ID,
        content="Hi! Happy to help. What would you like to know?",
    )

    assert message2 is not None
    assert message2.sender_id == PROFESSIONAL_USER_ID
    await db_session.commit()

    # 5. Retrieve messages
    messages = await messaging_service.get_conversation_messages(
        db_session,
        conversation_id=conversation.id,
        user_id=CLIENT_USER_ID,
        limit=50,
    )

    assert len(messages) == 2
    assert messages[0].content == "Hello! I have a question about nutrition."
    assert messages[1].content == "Hi! Happy to help. What would you like to know?"

    # 6. Check unread count for professional
    unread_count = await messaging_service.get_unread_count(
        db_session,
        conversation_id=conversation.id,
        user_id=PROFESSIONAL_USER_ID,
    )

    assert unread_count == 1  # Only the client's message

    # 7. Mark conversation as read for professional
    success = await messaging_service.mark_conversation_read(
        db_session,
        conversation_id=conversation.id,
        user_id=PROFESSIONAL_USER_ID,
    )

    assert success is True
    await db_session.commit()

    # 8. Verify unread count is now 0
    unread_count_after = await messaging_service.get_unread_count(
        db_session,
        conversation_id=conversation.id,
        user_id=PROFESSIONAL_USER_ID,
    )

    assert unread_count_after == 0


@pytest.mark.anyio
async def test_cannot_message_without_relationship(db_session: AsyncSession, setup_users):
    """Test that users cannot message professionals without a relationship."""
    CLIENT_USER_ID = setup_users["client_user_id"]
    PROFESSIONAL_USER_ID = setup_users["professional_user_id"]
    
    from app.services import messaging as messaging_service

    # Try to create conversation without any relationship
    conversation = await messaging_service.get_or_create_conversation(
        db_session,
        user_id=CLIENT_USER_ID,
        other_user_id=PROFESSIONAL_USER_ID,
        validate_policy=True,
    )

    # Should return None due to policy validation
    assert conversation is None


@pytest.mark.anyio
async def test_can_message_with_booking(db_session: AsyncSession, setup_users):
    """Test that users can message professionals they have booked with."""
    CLIENT_USER_ID = setup_users["client_user_id"]
    PROFESSIONAL_USER_ID = setup_users["professional_user_id"]
    
    from app.services import messaging as messaging_service

    # Create a booking
    booking = Booking(
        professional_id=PROFESSIONAL_USER_ID,
        client_user_id=CLIENT_USER_ID,
        service_name="Initial Consultation",
        status="confirmed",
        scheduled_for=None,
        is_immediate=True,
    )
    db_session.add(booking)
    await db_session.commit()

    # Now conversation creation should succeed
    conversation = await messaging_service.get_or_create_conversation(
        db_session,
        user_id=CLIENT_USER_ID,
        other_user_id=PROFESSIONAL_USER_ID,
        validate_policy=True,
    )

    assert conversation is not None
    assert len(conversation.participants) == 2


@pytest.mark.anyio
async def test_cannot_send_to_conversation_not_participant(db_session: AsyncSession, setup_users):
    """Test that users cannot send messages to conversations they're not in."""
    CLIENT_USER_ID = setup_users["client_user_id"]
    PROFESSIONAL_USER_ID = setup_users["professional_user_id"]
    
    from app.services import messaging as messaging_service

    # Create favorite and conversation
    favorite = UserFavourite(
        user_id=CLIENT_USER_ID,
        professional_id=PROFESSIONAL_USER_ID,
    )
    db_session.add(favorite)
    await db_session.commit()

    conversation = await messaging_service.get_or_create_conversation(
        db_session,
        user_id=CLIENT_USER_ID,
        other_user_id=PROFESSIONAL_USER_ID,
        validate_policy=True,
    )

    await db_session.commit()

    # Try to send message as a different user (not in conversation)
    other_user_id = uuid.uuid4()
    message = await messaging_service.send_message(
        db_session,
        conversation_id=conversation.id,
        sender_id=other_user_id,
        content="Trying to send unauthorized message",
    )

    # Should return None due to participant check
    assert message is None


@pytest.mark.anyio
async def test_list_conversations(db_session: AsyncSession, setup_users):
    """Test listing user's conversations."""
    CLIENT_USER_ID = setup_users["client_user_id"]
    PROFESSIONAL_USER_ID = setup_users["professional_user_id"]
    
    from app.services import messaging as messaging_service

    # Create favorite
    favorite = UserFavourite(
        user_id=CLIENT_USER_ID,
        professional_id=PROFESSIONAL_USER_ID,
    )
    db_session.add(favorite)
    await db_session.commit()

    # Create conversation
    conversation = await messaging_service.get_or_create_conversation(
        db_session,
        user_id=CLIENT_USER_ID,
        other_user_id=PROFESSIONAL_USER_ID,
        validate_policy=True,
    )
    await db_session.commit()

    # Send a message
    await messaging_service.send_message(
        db_session,
        conversation_id=conversation.id,
        sender_id=CLIENT_USER_ID,
        content="Test message",
    )
    await db_session.commit()

    # List conversations for client
    conversations = await messaging_service.get_user_conversations(
        db_session,
        user_id=CLIENT_USER_ID,
        limit=50,
    )

    assert len(conversations) == 1
    assert conversations[0].id == conversation.id
    assert conversations[0].last_message_at is not None


if __name__ == "__main__":
    print("Run with: docker-compose exec backend pytest tests/test_messaging_integration.py -v")
